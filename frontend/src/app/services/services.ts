import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IService } from '../../core/models/service';
import { Services } from '../../core/services/services';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './services.html',
  styleUrls: ['./services.css']
})
export class ServicesComponent {
  services = signal<IService[]>([]);
  constructor(private serviceService: Services){
    this.getAllData();
  }

  getAllData(){
    this.getServices()
  }

  public getServices(){
    this.serviceService.getServices().subscribe({
      next: (response) => {
        this.services.set(response);
      },
      error: () => {}
    })
  }
}
