import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api/api.service';
import { AuthService } from './services/auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  role: string;
  isDoctor: boolean = false;
  isAdmin: boolean = false;
  isPatient: boolean = false;
  isResearcher: boolean = false;
  isLogin: boolean = false;
  doctorUserName: string;
  patientUserName: string;
  title = 'SEPTON';

  notifications: any[] = []; // Array to hold notifications
  showNotifications: boolean = false; // Control the display of the notification panel
  unreadNotificationsCount: number = 0; // Count of unread notifications

  constructor(private _auth: AuthService, private apiService: ApiService) { }

  ngOnInit(): void {
    this.role = this._auth.getUserDetails('userData');
    this.isDoctor = this._auth.isUserDoctor();
    this.isAdmin = this._auth.isUserAdmin();
    this.isPatient = this._auth.isUserPatient();
    this.isResearcher = this._auth.isUserResearcher();
    this.isUserLogin();

    if (this.isDoctor) {
      this.doctorUserName = this._auth.getUserDetails('username');
      // Fetch notifications for doctor
      this.getNotifications();
    } else if (this.isPatient) {
      this.patientUserName = this._auth.getUserDetails('username');
      // Fetch notifications for patient
      this.getNotifications();
    }
  }

  isUserLogin() {
    if (this._auth.getToken() != null) {
      this.isLogin = true;
    }
  }

  onNotificationClick() {
    console.log('Notification button clicked!');
    this.showNotifications = !this.showNotifications; // Toggle notification panel visibility

    if (this.showNotifications) {
      // Mark notifications as read when the panel is opened
      this.markNotificationsAsRead();
    }
  }

  getNotifications() {
    if (this.isDoctor) {
      // Fetch notifications for doctor
      const doctorIdMatch = this.doctorUserName.match(/^doctor(\d+)$/i);
      const doctorId = doctorIdMatch ? parseInt(doctorIdMatch[1], 10) : null;
      const doctorObj = {
        doctorId: doctorId,
        username: this.doctorUserName,
      };

      this.apiService.getNotifications(doctorObj).subscribe(
        (response) => {
          if (response.notifications) {
            // For doctors, notifications have 'status'
            this.notifications = response.notifications.filter(
              (notification) => notification.status === 0 || notification.status === 1
            );
            console.log('Doctor Notifications:', this.notifications);

            this.updateUnreadNotificationsCount();
          } else {
            console.log('No notifications found for doctor.');
            this.notifications = [];
            this.unreadNotificationsCount = 0;
          }
        },
        (error) => {
          console.error('Error fetching notifications for doctor:', error);
          this.notifications = [];
          this.unreadNotificationsCount = 0;
        }
      );
    } else if (this.isPatient) {
      // Fetch notifications for patient
      const patientIdMatch = this.patientUserName.match(/^patient(\d+)$/i);
      const patientId = patientIdMatch ? parseInt(patientIdMatch[1], 10) : null;
      const patientObj = {
        patientId: patientId,
        username: this.patientUserName,
      };

      this.apiService.getPatientNotifications(patientObj).subscribe(
        (response) => {
          if (response.notifications) {
            // For patients, notifications may not have 'status'
            if (Array.isArray(response.notifications)) {
              this.notifications = response.notifications;
            } else {
              this.notifications = [response.notifications];
            }
            console.log('Patient Notifications:', this.notifications);

            // Update unread notifications count
            this.unreadNotificationsCount = this.notifications.length;
          } else {
            console.log('No notifications found for patient.');
            this.notifications = [];
            this.unreadNotificationsCount = 0;
          }
        },
        (error) => {
          console.error('Error fetching notifications for patient:', error);
          this.notifications = [];
          this.unreadNotificationsCount = 0;
        }
      );
    }
  }

  updateUnreadNotificationsCount() {
    if (this.isDoctor) {
      // For doctors, notifications have 'status'
      this.unreadNotificationsCount = this.notifications.filter(
        (notification) => notification.status === 0
      ).length;
    } else if (this.isPatient) {
      // For patients, all notifications are considered unread
      this.unreadNotificationsCount = this.notifications.length;
    }
  }

  markNotificationsAsRead() {
    if (this.isDoctor) {
      // Mark all unread notifications as read locally
      this.notifications.forEach((notification) => {
        if (notification.status === 0) {
          notification.status = 1; // Change unread to read
        }
      });

      // Update the unread notifications count
      this.unreadNotificationsCount = 0;

      // Prepare doctorObj with doctorId
      const doctorIdMatch = this.doctorUserName.match(/^doctor(\d+)$/i);
      const doctorId = doctorIdMatch ? parseInt(doctorIdMatch[1], 10) : null;
      const doctorObj = {
        doctorId: doctorId,
        username: this.doctorUserName,
      };

      // Send API request to update the read status in the backend for doctor
      this.apiService.markNotificationsAsRead(doctorObj).subscribe(
        (response) => {
          console.log('Doctor notifications marked as read.');
        },
        (error) => {
          console.error('Error marking notifications as read for doctor:', error);
        }
      );
    } else if (this.isPatient) {
      // For patients, you can implement logic to mark notifications as read if needed
      console.log('Patient notifications viewed.');
      // Update the unread notifications count
      this.unreadNotificationsCount = 0;
    }
  }

  // Handle notification selection (you can add logic here for when a notification is clicked)
  onNotificationSelect(notification: any) {
    console.log('Selected Notification:', notification);
  }

  // Optional: TrackBy function for ngFor
  trackByNotificationId(index: number, notification: any): number {
    return notification.id;
  }

  onYesClick(notification: any) {
    console.log('Yes clicked for notification:', notification);
    notification.actionTaken = true; // Disable buttons

    // Extract doctorId from the message string
    const doctorIdMatch = notification.message.match(/Doctor (\d+)/);
    const doctorId = doctorIdMatch ? parseInt(doctorIdMatch[1], 10) : null;

    const userObj = {
      notificationId: notification.id,
      response: 'yes',
      doctorId: doctorId,
      patientId: parseInt(this.patientUserName.replace(/^patient(\d+)$/i, '$1'), 10),
      username: this.patientUserName
    };

    this.apiService.changeStatus(userObj).subscribe(
      (response) => {
        console.log('Access request approved:', response);
        // Remove the notification from the list
        this.notifications = this.notifications.filter((n) => n.id !== notification.id);
        this.updateUnreadNotificationsCount();
      },
      (error) => {
        console.error('Error approving access request:', error);
        notification.actionTaken = false; // Re-enable buttons
      }
    );
  }



  // Handle 'No' button click
  onNoClick(notification: any) {
    console.log('No clicked for notification:', notification);
    notification.actionTaken = true; // Disable buttons

    // Extract doctorId from the message string
    const doctorIdMatch = notification.message.match(/Doctor (\d+)/);
    const doctorId = doctorIdMatch ? parseInt(doctorIdMatch[1], 10) : null;

    const userObj = {
      notificationId: notification.id,
      response: 'no',
      doctorId: doctorId,
      patientId: parseInt(this.patientUserName.replace(/^patient(\d+)$/i, '$1'), 10),
      username: this.patientUserName
    };

    this.apiService.changeStatus(userObj).subscribe(
      (response) => {
        console.log('Access request denied:', response);
        // Remove the notification from the list
        this.notifications = this.notifications.filter((n) => n.id !== notification.id);
        this.updateUnreadNotificationsCount();
      },
      (error) => {
        console.error('Error denying access request:', error);
        notification.actionTaken = false; // Re-enable buttons
      }
    );
  }
}