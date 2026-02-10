import { MatTableModule } from "@angular/material/table";
import {
  PageRequest,
  PaginatedDataSource,
} from "@app/models/utils/paginatedDataSource.entity";
import { PaginatedResponse } from "@app/models/utils/paginatedResponse.entity";
import { Logger } from "@app/services/logger.service";
import { CustomizedTableComponent } from "@app/shared/components/customized-table/customized-table.component";
import { createHostFactory, SpectatorHost } from "@ngneat/spectator/vitest";
import { Observable, of } from "rxjs";

const log = new Logger("CustomizedTableComponent");
Logger.level = 4;

interface T {
  id: number;
  name: string;
}
interface Q {
  name: string;
}

class MockService {
  static testData: T[] = [
    { id: 1, name: "Book 1" },
    { id: 2, name: "Book 2" },
    { id: 3, name: "Book 3" },
  ];

  static getPaginated(
    req?: PageRequest<T, Q>
  ): Observable<PaginatedResponse<T>> {
    const page = req?.page || 0;
    const limit = req?.limit || 1;
    const testData = MockService.testData.slice(
      page * limit,
      (page + 1) * limit
    );
    return of({
      data: testData,
      page,
      limit,
      count: MockService.testData.length,
    });
  }
}

describe("CustomizedTableComponent", () => {
  let spectator: SpectatorHost<CustomizedTableComponent<T, Q>>;
  const createHost = createHostFactory({
    component: CustomizedTableComponent,
    imports: [MatTableModule],
  });

  beforeEach(() => {
    spectator = createHost(
      `<app-customized-table [data]="data" class="table">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let item">{{ item.name }}</td>
          </ng-container>  
        </app-customized-table>`,
      {
        hostProps: {
          data: new PaginatedDataSource<T, Q>(
            (req) => MockService.getPaginated(req),
            {
              log: log,
              query: { name: "" },
              sort: {
                property: "name",
                order: "asc",
              },
              displayedColumns: ["name"],
              pageSize: 1,
            }
          ),
        },
      }
    ) as SpectatorHost<CustomizedTableComponent<T, Q>>;
    spectator.component.data.refresh();
    spectator.detectChanges();
  });

  it("Should create", () => {
    expect(spectator.query(".table-wrapper")).toBeTruthy();
    expect(spectator.queryAll("tr").length).toBe(2);
    expect(spectator.queryLast("tr")).toContainText("Book 1");
  });

  it("Should change page", () => {
    //
    expect(spectator.queryAll("tr").length).toBe(2);
    spectator.click(".mat-mdc-paginator-navigation-next");
    expect(spectator.queryAll("tr").length).toBe(2);
    expect(spectator.queryLast("tr")).toContainText("Book 2");
  });

  it("Should show loading", () => {
    spectator.component.data["loading"].next(true);
    spectator.detectChanges();
    expect(spectator.query(".mat-mdc-progress-spinner")).toBeTruthy();
  });
});
