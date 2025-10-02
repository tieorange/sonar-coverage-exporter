export interface CoverageLineDto {
  lineNumber: number;
  code: string;
}

export interface CoverageGroupDto {
  startLine: number;
  endLine: number;
  lines: CoverageLineDto[];
}

export interface CoverageReportDto {
  projectName: string;
  filePath: string;
  url: string;
  generatedAt: string;
  totalUncoveredLines: number;
  groups: CoverageGroupDto[];
}

export class CoverageLineModel implements CoverageLineDto {
  constructor(public readonly lineNumber: number, public readonly code: string) {}

  public toDto(): CoverageLineDto {
    return { lineNumber: this.lineNumber, code: this.code };
  }

  public static fromDto(dto: CoverageLineDto): CoverageLineModel {
    return new CoverageLineModel(dto.lineNumber, dto.code);
  }
}

export class CoverageGroupModel implements CoverageGroupDto {
  public startLine: number;
  public endLine: number;
  private readonly lineItems: CoverageLineModel[];

  constructor(initialLine: CoverageLineModel) {
    this.startLine = initialLine.lineNumber;
    this.endLine = initialLine.lineNumber;
    this.lineItems = [initialLine];
  }

  public get lines(): CoverageLineModel[] {
    return [...this.lineItems];
  }

  public get length(): number {
    return this.lineItems.length;
  }

  public canAppend(line: CoverageLineModel): boolean {
    return line.lineNumber === this.endLine + 1;
  }

  public append(line: CoverageLineModel): void {
    if (!this.canAppend(line)) {
      throw new Error(
        `Unable to append line ${line.lineNumber} to coverage group ending at ${this.endLine}.`,
      );
    }
    this.lineItems.push(line);
    this.endLine = line.lineNumber;
  }

  public toDto(): CoverageGroupDto {
    return {
      startLine: this.startLine,
      endLine: this.endLine,
      lines: this.lineItems.map((line) => line.toDto()),
    };
  }

  public static fromDto(dto: CoverageGroupDto): CoverageGroupModel {
    if (!dto.lines.length) {
      throw new Error('Cannot create a CoverageGroupModel without any lines.');
    }
    const group = new CoverageGroupModel(CoverageLineModel.fromDto(dto.lines[0]));
    dto.lines.slice(1).forEach((line) => group.append(CoverageLineModel.fromDto(line)));
    return group;
  }
}

export class CoverageReportModel implements CoverageReportDto {
  public readonly generatedAt: string;
  public readonly totalUncoveredLines: number;
  private readonly coverageGroups: CoverageGroupModel[];

  constructor(
    public readonly projectName: string,
    public readonly filePath: string,
    public readonly url: string,
    groups: CoverageGroupModel[],
    generatedAt?: string,
  ) {
    this.coverageGroups = [...groups];
    this.generatedAt = generatedAt ?? new Date().toISOString();
    this.totalUncoveredLines = groups.reduce((sum, group) => sum + group.length, 0);
  }

  public get groups(): CoverageGroupModel[] {
    return [...this.coverageGroups];
  }

  public toDto(): CoverageReportDto {
    return {
      projectName: this.projectName,
      filePath: this.filePath,
      url: this.url,
      generatedAt: this.generatedAt,
      totalUncoveredLines: this.totalUncoveredLines,
      groups: this.coverageGroups.map((group) => group.toDto()),
    };
  }

  public static fromDto(dto: CoverageReportDto): CoverageReportModel {
    const groups = dto.groups.map((group) => CoverageGroupModel.fromDto(group));
    return new CoverageReportModel(dto.projectName, dto.filePath, dto.url, groups, dto.generatedAt);
  }
}
