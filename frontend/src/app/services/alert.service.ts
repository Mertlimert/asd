import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

export interface Alert {
  id?: string;
  type: AlertType;
  message: string;
  autoClose: boolean;
  keepAfterRouteChange?: boolean;
  fade?: boolean; // For fade-out animation
}

export enum AlertType {
  Success,
  Error,
  Info,
  Warning
}

@Injectable({ providedIn: 'root' })
export class AlertService {
  private subject = new Subject<Alert>();
  private defaultId = 'default-alert';

  // enable subscribing to alerts observable
  onAlert(id = this.defaultId): Observable<Alert> {
    return this.subject.asObservable().pipe(filter(x => x && x.id === id));
  }

  // convenience methods
  success(message: string, autoClose = true, keepAfterRouteChange = false) {
    this.alert({ id: this.defaultId, type: AlertType.Success, message, autoClose, keepAfterRouteChange });
  }

  error(message: string, autoClose = true, keepAfterRouteChange = false) {
    this.alert({ id: this.defaultId, type: AlertType.Error, message, autoClose, keepAfterRouteChange });
  }

  info(message: string, autoClose = true, keepAfterRouteChange = false) {
    this.alert({ id: this.defaultId, type: AlertType.Info, message, autoClose, keepAfterRouteChange });
  }

  warn(message: string, autoClose = true, keepAfterRouteChange = false) {
    this.alert({ id: this.defaultId, type: AlertType.Warning, message, autoClose, keepAfterRouteChange });
  }

  // main alert method
  alert(alert: Alert) {
    alert.id = alert.id || this.defaultId;
    alert.autoClose = (alert.autoClose === undefined ? true : alert.autoClose);
    this.subject.next(alert);
  }

  // clear alerts
  clear(id = this.defaultId) {
    // Send an empty alert object with the specified ID to clear alerts for that ID
     this.subject.next({ id: id } as Alert);
  }
}