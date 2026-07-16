import type { CSSProperties } from 'react';

export interface Stripe {
  sizePx: number;
  color: string;
}

export interface GeneratorOptions {
  angle?: number;
  ratio?: boolean;
  stripes: readonly Stripe[];
}

export type GeneratedCss = Pick<
  Required<CSSProperties>,
  'backgroundImage' | 'backgroundSize'
>;

const DEG_TO_RAD = Math.PI / 180;

const toFiniteNumber = (value: number | string): number => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatPercent = (value: number): string =>
  value
    .toFixed(2)
    .replace(/\.0+$/, '')
    .replace(/(\.[1-9]*)0+$/, '$1');

const isRightOrStraightAngle = (angle: number): boolean =>
  angle === 0 || angle === 90 || angle === 180;

export class CssDiagonalLineGenerator {
  public angleDeg = -45;
  public ratio = true;
  private stripes: Stripe[];

  public constructor(options: GeneratorOptions) {
    this.angleDeg = options.angle ?? this.angleDeg;
    this.ratio = options.ratio ?? this.ratio;
    this.stripes = [...options.stripes];
  }

  public getStripes(): readonly Stripe[] {
    return [...this.stripes];
  }

  public setStripes(stripes: readonly Stripe[]): void {
    this.stripes = [...stripes];
  }

  public getCode(): GeneratedCss {
    const normalizedAngle = this.normalizeAngleDeg(this.angleDeg);
    this.angleDeg = normalizedAngle;

    if (this.stripes.length === 0) {
      return {
        backgroundImage: 'none',
        backgroundSize: '0.00px 0.00px',
      };
    }

    const stripesSizeSum = this.stripes.reduce(
      (sum, stripe) => sum + stripe.sizePx,
      0,
    );
    if (stripesSizeSum <= 0) {
      return {
        backgroundImage: 'none',
        backgroundSize: '0.00px 0.00px',
      };
    }

    let bgSizeX = this.computeBackgroundWidth(stripesSizeSum, normalizedAngle);
    let bgSizeY = this.computeBackgroundHeight(bgSizeX, normalizedAngle);

    if (bgSizeY > bgSizeX) {
      const previousX = bgSizeX;
      bgSizeX = (bgSizeX * bgSizeX) / bgSizeY;
      bgSizeY = previousX;
    }

    const bgSizeXText = bgSizeX.toFixed(2);
    const bgSizeYText = bgSizeY.toFixed(2);

    const percents = this.stripes.map(
      (stripe) => (stripe.sizePx * 100) / stripesSizeSum / 2,
    );

    const gradientStops: string[] = [];

    for (let index = 0; index < this.stripes.length * 2; index += 1) {
      const currentIndex = index % this.stripes.length;
      const nextIndex = (currentIndex + 1) % this.stripes.length;

      const currentStripe = this.stripes[currentIndex]!;
      const nextStripe = this.stripes[nextIndex]!;
      const currentPercent = this.sumPercentsUpTo(index, percents);

      if (index === this.stripes.length * 2 - 1) {
        gradientStops.push(`${currentStripe.color} ${currentPercent}%`);
      } else {
        gradientStops.push(
          `${currentStripe.color} ${currentPercent}%`,
          `${nextStripe.color} ${currentPercent}%`,
        );
      }
    }

    return {
      backgroundImage: `linear-gradient(${normalizedAngle}deg, ${gradientStops.join(', ')})`,
      backgroundSize: `${bgSizeXText}px ${bgSizeYText}px`,
    };
  }

  public addStripe(stripe: Stripe): void {
    this.stripes.push(stripe);
  }

  public removeStripe(key = this.stripes.length - 1): void {
    if (!this.isValidIndex(key)) {
      return;
    }
    this.stripes.splice(key, 1);
  }

  public moveStripe(key: number, newKey: number): void {
    if (!this.isValidIndex(key) || !this.isValidIndex(newKey)) {
      return;
    }

    [this.stripes[key], this.stripes[newKey]] = [
      this.stripes[newKey]!,
      this.stripes[key]!,
    ];
  }

  public moveStripeReindex(key: number, newKey: number): void {
    if (!this.isValidIndex(key)) {
      return;
    }

    const [movedStripe] = this.stripes.splice(key, 1);
    if (!movedStripe) {
      return;
    }

    const clampedNewIndex = Math.max(0, Math.min(newKey, this.stripes.length));
    this.stripes.splice(clampedNewIndex, 0, movedStripe);
  }

  public changeStripeSize(key: number, value: number | string): void {
    const stripe = this.stripes[key];
    if (!stripe) {
      return;
    }
    stripe.sizePx = toFiniteNumber(value);
  }

  public changeStripeColor(key: number, value: string): void {
    const stripe = this.stripes[key];
    if (!stripe) {
      return;
    }
    stripe.color = value;
  }

  private normalizeAngleDeg(angle: number): number {
    let normalized = angle;
    while (normalized > 180) {
      normalized -= 180;
    }
    while (normalized < 0) {
      normalized += 180;
    }
    return normalized;
  }

  private computeBackgroundWidth(
    stripesSizeSum: number,
    angle: number,
  ): number {
    let width = stripesSizeSum * 2;

    if (angle > 0 && angle <= 45) {
      width /= 2;
    } else if (angle > 45 && angle < 90) {
      width *= Math.tan(angle * DEG_TO_RAD) / 2;
    } else if (angle > 90 && angle <= 135) {
      width *= Math.tan((180 - angle) * DEG_TO_RAD) / 2;
    } else if (angle > 135 && angle < 180) {
      width /= 2;
    }

    if (this.ratio && !isRightOrStraightAngle(angle)) {
      width /= Math.sin(angle * DEG_TO_RAD);
    }

    return width;
  }

  private computeBackgroundHeight(bgSizeX: number, angle: number): number {
    if (angle > 90 && angle < 180) {
      return bgSizeX * Math.tan((180 - angle) * DEG_TO_RAD);
    }
    if (!isRightOrStraightAngle(angle)) {
      return bgSizeX * Math.tan(angle * DEG_TO_RAD);
    }
    return bgSizeX;
  }

  private sumPercentsUpTo(index: number, percents: readonly number[]): string {
    let sum = 0;
    for (let cursor = 0; cursor <= index; cursor += 1) {
      const wrappedIndex = cursor % this.stripes.length;
      const value = percents[wrappedIndex] ?? 0;
      sum += value;
    }
    return formatPercent(sum);
  }

  private isValidIndex(index: number): boolean {
    return index >= 0 && index < this.stripes.length;
  }
}
