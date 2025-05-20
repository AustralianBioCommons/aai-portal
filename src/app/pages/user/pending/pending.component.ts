import { Component, inject, OnInit } from '@angular/core';
import { systemsList } from '../../../core/constants/constants';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-pending',
  imports: [LoadingSpinnerComponent],
  templateUrl: './pending.component.html',
  styleUrl: './pending.component.css',
})
export class PendingComponent implements OnInit {
  systemsList = systemsList;
  user: any = {};
  pendingSystems: string[] = [];
  loading = true;

  private auth = inject(AuthService);

  ngOnInit(): void {
    this.auth.getUser().subscribe((user) => {
      this.user = user;
      if (this.user?.user_metadata?.systems?.requested) {
        const pendingSystemIDs = this.user.user_metadata.systems.requested;
        this.pendingSystems = this.systemsList
          .filter((system) => pendingSystemIDs.includes(system.id))
          .map((system) => system.name);
      }
      this.loading = false;
    });
  }
}
