export interface ProductStock {
  readonly remaining?: boolean;
  readonly text?: string;
  readonly progressClass?: string;
}

export interface Product {
  readonly id: string;
  readonly title: string;
  readonly href: string;
  readonly imageSrc: string;
  readonly imageSizes: string;
  readonly price: number | null;
  readonly stock: ProductStock | null;
  readonly buttons: string[] | null;
  readonly status: 'active' | 'sold-out';
  readonly thumbnailGradient?: string;
  readonly category?: string;
  readonly thumbnailLabel?: string;
  readonly thumbnailEmoji?: string;
}
