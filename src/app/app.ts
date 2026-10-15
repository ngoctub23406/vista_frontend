
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  HostListener
} from '@angular/core';

import {
  RouterOutlet,
  Router,
  NavigationEnd
} from '@angular/router';

import { NavbarComponent } from './components/navbar/navbar';
import { FooterComponent } from './components/footer/footer';
import { CommonModule } from '@angular/common';
import { CompareWidgetComponent } from './components/compare-widget/compare-widget';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    CompareWidgetComponent,
    CommonModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  title = 'vista-frontend';

  showSplash = true;
  isClosing = false;
  showScrollTop = false;
  isAdminRoute = false;

  private routerSubscription?: Subscription;
  private splashTimer?: ReturnType<typeof setTimeout>;
  private closeTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.updateLayout(this.router.url);

    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(event => {
        this.updateLayout((event as NavigationEnd).urlAfterRedirects);
      });

    // Splash screen chỉ áp dụng cho giao diện User.
    if (!this.isAdminRoute) {
      this.splashTimer = setTimeout(() => {
        this.isClosing = true;

        this.closeTimer = setTimeout(() => {
          this.showSplash = false;
          this.cdr.detectChanges();
        }, 1000);
      }, 5000);
    } else {
      this.showSplash = false;
    }
  }

  private updateLayout(url: string): void {
    this.isAdminRoute =
      url === '/admin' ||
      url.startsWith('/admin/');

    if (this.isAdminRoute) {
      this.showScrollTop = false;
      this.showSplash = false;
      this.isClosing = false;

      if (this.splashTimer) {
        clearTimeout(this.splashTimer);
      }

      if (this.closeTimer) {
        clearTimeout(this.closeTimer);
      }
    }

    this.cdr.detectChanges();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    const url = this.router.url;

    const isAllowed =
      url === '/' ||
      url === '' ||
      url.startsWith('/products');

    this.showScrollTop =
      !this.isAdminRoute &&
      isAllowed &&
      window.scrollY > 300;
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();

    if (this.splashTimer) {
      clearTimeout(this.splashTimer);
    }

    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
    }
  }
}
