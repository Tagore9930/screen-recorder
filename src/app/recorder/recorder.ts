import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-recorder',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './recorder.html',
  styleUrl: './recorder.scss',
})
export class Recorder {
  public isAudio: boolean = true;
  public isVideo: boolean = false;

  // Streams
  private userStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;

  private mediaRecorder!: MediaRecorder;
  private recordedChunks: Blob[] = [];

  public isRecording = false;
  public isPaused = false;
  public videoUrl: string | null = null; // 👈 store preview URL

  // Timer and video size variables.
  public recordingTime: string = '00:00:00';
  private startTime: number = 0;
  private pausedTime: number = 0;
  private pauseStart: number = 0;
  private timerInterval: any;

  public recordingSize = '0 MB';
  private totalSize = 0;

  constructor(
    private cd: ChangeDetectorRef,
    private zone: NgZone,
  ) {}

  public async record(isStart: boolean) {
    if (isStart) {
      if (!this.screenStream) {
        await this.getScreenStream();

        if (!this.screenStream) {
          console.log('The userStream is empty.');
          return;
        }
      }

      if (this.isAudio || this.isVideo) {
        await this.getUserStream();

        if (!this.userStream) {
          console.log('The userStream is empty.');
          return;
        }
      }

      let tracks: MediaStreamTrack[] = [...this.screenStream.getVideoTracks()]; // screen

      if (this.userStream) {
        if (this.isAudio) {
          tracks.push(...this.userStream.getAudioTracks()); // mic audio
        }

        if (this.isVideo) {
          tracks.push(...this.userStream.getVideoTracks()); // camera video
        }
      }

      // 🔗 Combine streams (IMPORTANT)
      const combinedStream = new MediaStream(tracks);

      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(combinedStream);

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        this.zone.run(() => {
          if (event.data.size > 0) {
            this.recordedChunks.push(event.data);

            // ✅ Update size
            this.totalSize += event.data.size;
            this.recordingSize = this.formatBytes(this.totalSize);

            this.cd.detectChanges();
          }
        });
      };

      this.mediaRecorder.onstop = () => {
        this.zone.run(() => {
          const blob = new Blob(this.recordedChunks, {
            type: 'video/webm',
          });

          this.stopAll();

          // 👇 create preview URL
          this.videoUrl = URL.createObjectURL(blob);
          // setTimeout(() => {
          // this.isRecording = false;
          // });
        });
      };

      this.zone.run(() => {
        this.isRecording = true;
        this.mediaRecorder.start(1000);
        this.startTimer();
      });
    }

    if (!isStart) {
      if (this.mediaRecorder && this.isRecording) {
        this.stopAll();
        this.isRecording = false;
      }
    }
  }

  public togglePauseRecord() {
    if (!this.mediaRecorder) return;

    if (this.isPaused) {
      this.mediaRecorder.resume();
      this.isPaused = false;

      this.pausedTime += Date.now() - this.pauseStart;
    } else {
      this.mediaRecorder.pause();
      this.isPaused = true;
      this.pauseStart = Date.now();
    }

    this.cd.detectChanges();
  }

  private stopAll() {
    // Stop recorder safely
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    // ✅ Stop mic + camera
    this.userStream?.getTracks().forEach((track) => track.stop());

    // ✅ Stop screen sharing
    this.screenStream?.getTracks().forEach((track) => track.stop());

    // Reset All
    // Streams
    this.userStream = null;
    this.screenStream = null;

    // Basic Record
    this.isPaused = false;
    this.isRecording = false;

    // Timer
    clearInterval(this.timerInterval);
    this.recordingTime = '00:00:00';
    this.startTime = 0;
    this.pausedTime = 0;
    this.pauseStart = 0;
    this.timerInterval = null;

    // Video Size
    this.recordingSize = '0 MB';
    this.totalSize = 0;
  }

  // Get Streams methods
  private async getUserStream() {
    // 🎙️ Microphone + 🎥 Video.
    this.userStream = await navigator.mediaDevices.getUserMedia({
      audio: this.isAudio,
      video: this.isVideo,
    });

    if (!this.userStream) {
      alert('The user permissions is not allowed.');
      console.error('The user permissions is not allowed.');
    }
  }

  private async getScreenStream() {
    // 🎥 Screen (video only)
    this.screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });

    if (!this.screenStream) {
      alert('The user permissions is not allowed.');
      console.error('The user permissions is not allowed.');
    }

    // ✅ IMPORTANT: detect when user stops sharing
    const videoTrack = this.screenStream.getVideoTracks()[0];

    videoTrack.onended = () => {
      console.log('Screen sharing stopped by user');

      // ✅ Stop everything (mic + camera + screen)
      this.stopAll();

      // ✅ Update UI state
      this.isRecording = false;
      this.cd.detectChanges();
    };
  }

  // Timer methods
  private startTimer() {
    this.startTime = Date.now();

    this.timerInterval = setInterval(() => {
      this.zone.run(() => {
        if (this.isPaused) return;

        const now = Date.now();
        const effectiveTime = now - this.startTime - this.pausedTime;

        const hrs = Math.floor(effectiveTime / 3600000);
        const mins = Math.floor((effectiveTime % 3600000) / 60000);
        const secs = Math.floor((effectiveTime % 60000) / 1000);

        this.recordingTime = `${this.pad(hrs)}:${this.pad(mins)}:${this.pad(secs)}`;

        this.cd.detectChanges();
      });
    }, 1000);
  }

  private pad(n: number): string {
    return n.toString().padStart(2, '0');
  }

  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / Math.pow(1024, i);

    return `${value.toFixed(2)} ${sizes[i]}`;
  }
}
