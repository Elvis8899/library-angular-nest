import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatDialogContent, MatDialogTitle } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import { MatProgressBar } from "@angular/material/progress-bar";
import { ROLE } from "@app/models/credentials.entity";
import { UserEntity } from "@app/models/user.entity";
import { BookEntity } from "@app/pages/books/book.entity";
import { Logger } from "@app/services/logger.service";
import { UserService } from "@app/services/user.http.service";
import { DialogActionsComponent } from "@app/shared/components/dialogActions/dialogActions.component";
import { textKey } from "@app/shared/utils/textMatch.utility";
import { StronglyTypedDialog } from "@app/shared/utils/typedDialog.utility";
import { TranslatePipe } from "@ngx-translate/core";

const log = new Logger("ChooseUserDialogComponent");

// The API's largest page. The users endpoint has no search or role filter,
// so the clients are loaded at once and searched here.
const allUsersPage = { page: 0, limit: 1000 };

export interface ChooseUserDialogData {
  book: BookEntity;
}

/** Picks the client renting a book; closes with their id. */
@Component({
  selector: "app-choose-user-dialog",
  templateUrl: "./chooseUser.dialog.component.html",
  styleUrl: "./chooseUser.dialog.component.scss",
  imports: [
    ReactiveFormsModule,
    MatAutocompleteModule,
    DialogActionsComponent,
    MatDialogContent,
    MatDialogTitle,
    MatFormFieldModule,
    MatIcon,
    MatInput,
    MatProgressBar,
    TranslatePipe,
  ],
})
export class ChooseUserDialogComponent
  extends StronglyTypedDialog<ChooseUserDialogData, string>
  implements OnInit
{
  private readonly _userService = inject(UserService);

  readonly bookName = this.data.book.name;
  readonly loading = signal(true);
  readonly clients = signal<UserEntity[]>([]);

  // The picked user. With requireSelection the control doesn't take the
  // typed text: it stays as it was while typing, and becomes null when the
  // field is left without picking a user. The text goes to `search`.
  readonly clientControl = new FormControl<UserEntity | null>(null);
  readonly search = signal("");
  readonly selectedClient = toSignal(this.clientControl.valueChanges, {
    initialValue: this.clientControl.value,
  });

  readonly filteredClients = computed(() => {
    // Accents, case and extra spaces don't matter
    const search = textKey(this.search());
    return this.clients().filter(
      (client) =>
        textKey(client.name).includes(search) ||
        textKey(client.email).includes(search),
    );
  });

  ngOnInit() {
    this._userService.getPaginatedUsers(allUsersPage).subscribe({
      next: (res) => {
        this.clients.set(res.data.filter((u) => u.role !== ROLE.ADMIN));
        this.loading.set(false);
      },
      error: (error) => {
        log.error(error);
        this.dialogRef.close();
      },
    });
  }

  onSearch(event: Event) {
    this.search.set((event.target as HTMLInputElement).value);
  }

  // Shows every client again when the panel reopens on a picked one
  onClientPicked() {
    this.search.set("");
  }

  rent() {
    this.dialogRef.close(this.selectedClient()?.id);
  }

  displayName(user: UserEntity | null): string {
    return user?.name ?? "";
  }
}
