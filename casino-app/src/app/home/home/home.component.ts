import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  balance: number = 0;

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit() {
    this.auth.userBalance$.subscribe(money => {
      this.balance = money;
    });
  }

  nav(path: string) {
    this.router.navigate([path]);
  }

  logout() {
    this.auth.logout().then(() => {
      this.router.navigate(['/']);
    });
  }
}
