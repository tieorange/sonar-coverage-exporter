import { CoverageGroupModel, CoverageLineModel } from '../../domain/coverage';

export class CoverageGrouper {
  public group(lines: CoverageLineModel[]): CoverageGroupModel[] {
    if (!lines.length) {
      return [];
    }

    const groups: CoverageGroupModel[] = [];
    let current: CoverageGroupModel | null = null;

    lines.forEach((line) => {
      if (!current || !current.canAppend(line)) {
        current = new CoverageGroupModel(line);
        groups.push(current);
        return;
      }

      current.append(line);
    });

    return groups;
  }
}
