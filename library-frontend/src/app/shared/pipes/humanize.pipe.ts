import { Pipe, PipeTransform } from "@angular/core";
import { humanize } from "@core/utils";

@Pipe({
  name: "humanize",
  standalone: true,
})
export class HumanizePipe implements PipeTransform {
  transform(value: string, caseSplit = false): string {
    return humanize(value, caseSplit);
  }
}
