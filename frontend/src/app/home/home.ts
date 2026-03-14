import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../env/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home {
  whatsappNumber = environment.whatsappNumber;
}
