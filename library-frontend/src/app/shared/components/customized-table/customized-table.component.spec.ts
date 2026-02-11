import { MatTableModule } from "@angular/material/table";
import {
  Page,
  PageRequest,
  PaginatedDataSource,
} from "@app/models/utils/paginatedDataSource.entity";
import { PaginatedResponse } from "@app/models/utils/paginatedResponse.entity";
import { Logger } from "@app/services/logger.service";
import { CustomizedTableComponent } from "@app/shared/components/customized-table/customized-table.component";
import { createHostFactory, SpectatorHost } from "@ngneat/spectator/vitest";
import { Observable, of } from "rxjs";

const log = new Logger("CustomizedTableComponent");
Logger.level = 0;

interface T {
  id: number;
  name: string;
}
interface Q {
  name: string;
}

class MockService {
  static testData: T[] = [
    { id: 1, name: "Item 1" },
    { id: 2, name: "Item 2" },
    { id: 3, name: "Item 3" },
  ];

  static getPaginated = vi.fn(
    (req?: PageRequest<T, Q>): Observable<PaginatedResponse<T>> => {
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
  );
}

describe("CustomizedTableComponent", () => {
  let spectator: SpectatorHost<CustomizedTableComponent<T, Q>>;
  const createHost = createHostFactory({
    component: CustomizedTableComponent,
    imports: [MatTableModule],
    detectChanges: false,
  });

  beforeEach(() => {
    MockService.getPaginated.mockClear();
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

    spectator.detectChanges();
  });

  it("Should create", () => {
    expect(MockService.getPaginated).toHaveBeenCalledTimes(1);
    expect(spectator.query(".table-wrapper")).toBeTruthy();
    expect(spectator.queryAll("tr").length).toBe(2);
    expect(spectator.queryLast("tr")).toContainText("Item 1");
  });

  it("Should change page", () => {
    //
    expect(spectator.queryAll("tr").length).toBe(2);
    spectator.click(".mat-mdc-paginator-navigation-next");
    expect(spectator.queryAll("tr").length).toBe(2);
    expect(spectator.queryLast("tr")).toContainText("Item 2");
  });

  it("Should show loading", () => {
    spectator.component.data["loading"].next(true);
    spectator.detectChanges();
    expect(spectator.query(".mat-mdc-progress-spinner")).toBeTruthy();
  });

  it("Change paginationSize should show all items", () => {
    spectator.click(".mat-mdc-paginator-touch-target");
    spectator.detectChanges();
    spectator.queryLast(".mdc-list-item")?.dispatchEvent(new Event("click"));
    spectator.detectChanges();
    expect(spectator.queryAll("tr").length).toBe(4);
  });

  it("Should show loading", () => {
    spectator.component.data["page$"].next(null as unknown as Page<T>);
    spectator.detectChanges();
    expect(spectator.query(".mat-mdc-paginator-navigation-next")).toBeFalsy();
  });
});
