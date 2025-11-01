import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-project-detail',
  imports: [CommonModule],
  templateUrl: './project-detail.html',
  styleUrls: ['./project-detail.css'],
})
export class ProjectDetail {
  images = [
    'https://via.placeholder.com/600x400.png?text=Before',
    'https://via.placeholder.com/600x400.png?text=After',
    'https://via.placeholder.com/600x400.png?text=Additional+Image+1',
    'https://via.placeholder.com/600x400.png?text=Additional+Image+2',
  ];
  currentIndex = 0;

  nextImage() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
  }

  prevImage() {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
  }
}
