import { Pipe, PipeTransform } from "@angular/core";
import { HumanizeSlugUtility } from "@app/shared/utils/humanize-slug.utility";

@Pipe({
  name: "humanize",
  standalone: true,
})
export class HumanizePipe implements PipeTransform {
  transform(value: string, caseSplit = false): string {
    return HumanizeSlugUtility.humanize(value, caseSplit);
  }
}
