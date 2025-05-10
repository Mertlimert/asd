import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Alert, AlertType, AlertService } from '../../services/alert.service'; // Adjust path if needed

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class AlertComponent implements OnInit, OnDestroy {
  @Input() id = 'default-alert';
  @Input() fade = true;

  alerts: Alert[] = [];
  alertSubscription!: Subscription;

  constructor(private alertService: AlertService) { }

  ngOnInit() {
    this.alertSubscription = this.alertService.onAlert(this.id)
      .subscribe(alert => {
        // clear alerts when an empty alert is received
        if (!alert.message) {
          // filter out alerts without 'keepAfterRouteChange' flag
          this.alerts = this.alerts.filter(x => x.keepAfterRouteChange);
          // remove 'keepAfterRouteChange' flag on the rest
          this.alerts.forEach(x => delete x.keepAfterRouteChange);
          return;
        }

        // add alert to array
        this.alerts.push(alert);

        // auto close alert if required
        if (alert.autoClose) {
          setTimeout(() => this.removeAlert(alert), 3000);
        }
      });
  }

  ngOnDestroy() {
    // unsubscribe to avoid memory leaks
    this.alertSubscription.unsubscribe();
  }

  removeAlert(alert: Alert) {
    // check if already removed to prevent error on auto close
    if (!this.alerts.includes(alert)) return;

    if (this.fade) {
      // fade out alert
      const alertToRemove = this.alerts.find(x => x === alert);
      if (alertToRemove) {
        alertToRemove.fade = true; // Add fade property for CSS transition
      }

      // remove alert after faded out
      setTimeout(() => {
        this.alerts = this.alerts.filter(x => x !== alert);
      }, 250); // Match timeout with CSS transition duration
    } else {
      // remove alert
      this.alerts = this.alerts.filter(x => x !== alert);
    }
  }

  cssClass(alert: Alert): string {
    if (!alert) {
        return '';
    }

    const classes = ['alert', 'alert-dismissible', 'mt-4', 'container'];

    const alertTypeClass: { [key in AlertType]?: string } = {
        [AlertType.Success]: 'alert-success',
        [AlertType.Error]: 'alert-danger',
        [AlertType.Info]: 'alert-info',
        [AlertType.Warning]: 'alert-warning'
    };

    const typeClass = alertTypeClass[alert.type];
    if (typeClass) {
        classes.push(typeClass);
    }


    if (alert.fade) {
        classes.push('fade-out'); // Class to trigger fade-out animation
    }

    return classes.join(' ');
  }
}
