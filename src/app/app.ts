import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { GlobalLoaderComponent } from './shared/components/global-loader/global-loader.component';
import { RouterLoadingService } from './core/services/router-loading.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, GlobalLoaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private readonly routerLoadingService = inject(RouterLoadingService);

  ngOnInit(): void {
    this.routerLoadingService.initialize();
  }
}
