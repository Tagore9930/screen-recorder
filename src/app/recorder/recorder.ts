import { ChangeDetectorRef, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';

@Component({
  selector: 'app-recorder',
  imports: [MatButtonModule, MatIconModule, MatSidenavModule],
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
  public videoUrl: string | null = null; // 👈 store preview URL

  constructor(private cd: ChangeDetectorRef) {}

  public async record(isStart: boolean) {
    if (isStart) {
      if (this.isAudio || this.isVideo) {
        await this.getUserStream();

        if (!this.userStream) {
          console.log('The userStream is empty.');
          return;
        }
      }

      // if (!this.screenStream) {
      await this.getScreenStream();

      if (!this.screenStream) {
        console.log('The userStream is empty.');
        return;
      }
      // }

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
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, {
          type: 'video/webm',
        });

        this.stopStreams();

        // 👇 create preview URL
        this.videoUrl = URL.createObjectURL(blob);
        // setTimeout(() => {
        // this.isRecording = false;
        // });
        this.cd.detectChanges();
      };

      this.isRecording = true;
      this.mediaRecorder.start();
      this.cd.detectChanges();
    }

    if (!isStart) {
      if (this.mediaRecorder && this.isRecording) {
        this.mediaRecorder.stop();
        this.stopStreams();
        this.isRecording = false;
      }
    }
  }

  public isPaused = false;
  public togglePauseRecord() {
    if (!this.mediaRecorder) return;

    if (this.isPaused) {
      this.mediaRecorder.resume();
      this.isPaused = false;
    } else {
      this.mediaRecorder.pause();
      this.isPaused = true;
    }

    this.cd.detectChanges();
  }

  private stopStreams() {
    // ✅ Stop mic + camera
    this.userStream?.getTracks().forEach((track) => track.stop());

    // ✅ Stop screen sharing
    this.screenStream?.getTracks().forEach((track) => track.stop());
  }

  // Bring Streams methods
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
  }
}
