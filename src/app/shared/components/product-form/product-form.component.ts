import { Component, Input, OnInit, Output, EventEmitter, signal, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgFor, NgIf } from '@angular/common';
import { Product } from '../../../core/models/product.model';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatChipsModule,
    MatTooltipModule,
    NgFor,
    NgIf
  ],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss'
})
export class ProductFormComponent implements OnInit {
  @Input() product: Product | null = null;
  @Input() mode: 'create' | 'edit' = 'create';
  @Output() saved = new EventEmitter<Product>();
  @Output() cancelled = new EventEmitter<void>();
  private readonly formBuilder: FormBuilder = inject(FormBuilder);
  private readonly productService: ProductService = inject(ProductService);
  private readonly toastService: ToastService = inject(ToastService);
  readonly form = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    price: [0, [Validators.required, Validators.min(0)]],
    currency: ['USD', [Validators.required]],
    is_active: [true],
    features: this.formBuilder.array<string>([]),
    size: [''],
    color: [''],
    material: [''],
    brand: [''],
    ply_rating: [''],
    about: this.formBuilder.array<string>([])
  });

  readonly uploading = signal(false);
  readonly saving = signal(false);
  readonly selectedFiles = signal<File[]>([]);
  readonly imageUrls = signal<string[]>([]);
  readonly uploadedImageUrls = signal<string[]>([]);
  readonly mainImageIndex = signal<number>(0);

  readonly isEditMode = computed(() => this.mode === 'edit' && !!this.product);

  ngOnInit(): void {
    if (this.product) {
      this.populateForm(this.product);
    } else {
      this.addFeature();
      this.addAboutItem();
    }
  }

  get featuresArray(): FormArray {
    return this.form.get('features') as FormArray;
  }

  get aboutArray(): FormArray {
    return this.form.get('about') as FormArray;
  }

  addFeature(value = ''): void {
    this.featuresArray.push(this.formBuilder.control(value, Validators.required));
  }

  removeFeature(index: number): void {
    this.featuresArray.removeAt(index);
  }

  addAboutItem(value = ''): void {
    this.aboutArray.push(this.formBuilder.control(value, Validators.required));
  }

  removeAboutItem(index: number): void {
    this.aboutArray.removeAt(index);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      this.selectedFiles.set([...this.selectedFiles(), ...files]);
      
      // Preview images
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const url = e.target?.result as string;
          this.imageUrls.update(urls => [...urls, url]);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeImage(index: number): void {
    this.imageUrls.update(urls => urls.filter((_, i) => i !== index));
    this.selectedFiles.update(files => files.filter((_, i) => i !== index));
  }

  removeUploadedImage(index: number): void {
    this.uploadedImageUrls.update(urls => urls.filter((_, i) => i !== index));
    // Adjust main image index if needed
    if (this.mainImageIndex() >= index && this.mainImageIndex() > 0) {
      this.mainImageIndex.update(idx => idx - 1);
    }
  }

  setMainImage(index: number, isUploaded: boolean): void {
    if (isUploaded) {
      // Main image is from uploaded images
      this.mainImageIndex.set(index);
    } else {
      // Main image is from new images - index is relative to uploaded images count
      const uploadedCount = this.uploadedImageUrls().length;
      this.mainImageIndex.set(uploadedCount + index);
    }
  }

  getMainImageIndex(): number {
    return this.mainImageIndex();
  }

  isMainImage(index: number, isUploaded: boolean): boolean {
    if (isUploaded) {
      return index === this.mainImageIndex();
    } else {
      const uploadedCount = this.uploadedImageUrls().length;
      return (uploadedCount + index) === this.mainImageIndex();
    }
  }

  getAllImages(): string[] {
    return [...this.uploadedImageUrls(), ...this.imageUrls()];
  }

  private populateForm(product: Product): void {
    this.form.patchValue({
      name: product.name,
      description: product.description,
      price: product.price,
      currency: product.currency,
      is_active: product.is_active,
      size: product.size || '',
      color: product.color || '',
      material: product.material || '',
      brand: product.brand || '',
      ply_rating: product.ply_rating || ''
    });

    // Populate features
    this.featuresArray.clear();
    if (product.features && product.features.length > 0) {
      product.features.forEach(feature => this.addFeature(feature));
    } else {
      this.addFeature();
    }

    // Populate about
    this.aboutArray.clear();
    if (product.about && product.about.length > 0) {
      product.about.forEach(item => this.addAboutItem(item));
    } else {
      this.addAboutItem();
    }

    // Set existing images
    if (product.image_urls && product.image_urls.length > 0) {
      this.uploadedImageUrls.set(product.image_urls);
      // Find main image index
      const mainIndex = product.image_url ? product.image_urls.indexOf(product.image_url) : 0;
      this.mainImageIndex.set(mainIndex >= 0 ? mainIndex : 0);
    } else if (product.image_url) {
      this.uploadedImageUrls.set([product.image_url]);
      this.mainImageIndex.set(0);
    }
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.error('Form invalid', 'Please fill in all required fields correctly.');
      return;
    }

    this.saving.set(true);
    try {
      const formValue = this.form.getRawValue();
      const features = this.featuresArray.value.filter((f: string) => f.trim());
      const about = this.aboutArray.value.filter((a: string) => a.trim());

      // Upload new images if any
      let finalImageUrls = [...this.uploadedImageUrls()];
      if (this.selectedFiles().length > 0) {
        this.uploading.set(true);
        if (this.isEditMode() && this.product) {
          const uploadedUrls = await this.productService.uploadProductImages(
            this.selectedFiles(),
            this.product.id
          );
          finalImageUrls = [...finalImageUrls, ...uploadedUrls];
        }
        this.uploading.set(false);
      }

      // Determine main image based on selection
      // Main image index is relative to all images (uploaded + new)
      const allImages = [...this.uploadedImageUrls(), ...this.imageUrls()];
      const mainIndex = this.mainImageIndex();
      let mainImageUrl: string | null = null;
      
      if (allImages.length > 0) {
        if (mainIndex < this.uploadedImageUrls().length) {
          // Main image is from uploaded images
          mainImageUrl = this.uploadedImageUrls()[mainIndex];
        } else {
          // Main image is from new images (for edit mode, these are now in finalImageUrls)
          const newImageIndex = mainIndex - this.uploadedImageUrls().length;
          if (this.isEditMode() && newImageIndex < (finalImageUrls.length - this.uploadedImageUrls().length)) {
            // New images have been uploaded, get from finalImageUrls
            mainImageUrl = finalImageUrls[this.uploadedImageUrls().length + newImageIndex];
          } else if (newImageIndex < this.imageUrls().length) {
            // Still using preview URL (shouldn't happen in edit mode, but handle it)
            mainImageUrl = this.imageUrls()[newImageIndex];
          }
        }
      }

      // If no main image selected, use first image
      if (!mainImageUrl && finalImageUrls.length > 0) {
        mainImageUrl = finalImageUrls[0];
      }

      // Reorder images to put main image first
      if (mainImageUrl && finalImageUrls.length > 1 && finalImageUrls.includes(mainImageUrl)) {
        const reorderedImages = [
          mainImageUrl,
          ...finalImageUrls.filter((url) => url !== mainImageUrl)
        ];
        finalImageUrls = reorderedImages;
      }

      const productData: Omit<Product, 'id'> = {
        name: formValue.name ?? '',
        description: formValue.description ?? '',
        price: formValue.price ?? 0,
        currency: formValue.currency ?? 'USD',
        is_active: formValue.is_active ?? true,
        features,
        about: about.length > 0 ? about : undefined,
        size: formValue.size || undefined,
        color: formValue.color || undefined,
        material: formValue.material || undefined,
        brand: formValue.brand || undefined,
        ply_rating: formValue.ply_rating || undefined,
        image_url: mainImageUrl || finalImageUrls[0] || null,
        image_urls: finalImageUrls.length > 0 ? finalImageUrls : null
      };

      let savedProduct: Product;
      if (this.isEditMode() && this.product) {
        savedProduct = await this.productService.updateProduct({
          ...productData,
          id: this.product.id
        });
        this.toastService.success('Product updated', `${savedProduct.name} has been updated.`);
      } else {
        // For create mode, we need to create first, then upload images
        savedProduct = await this.productService.createProduct({
          ...productData,
          image_url: null,
          image_urls: null
        });

        // Upload images after product creation
        if (this.selectedFiles().length > 0) {
          this.uploading.set(true);
          const uploadedUrls = await this.productService.uploadProductImages(
            this.selectedFiles(),
            savedProduct.id
          );
          this.uploading.set(false);

          // Determine main image from the uploaded URLs
          const mainIndex = this.mainImageIndex();
          let mainImageUrl: string | null = null;
          
          // For create mode, mainIndex should be relative to new images only
          if (mainIndex < uploadedUrls.length) {
            mainImageUrl = uploadedUrls[mainIndex];
          } else {
            mainImageUrl = uploadedUrls[0] || null;
          }

          finalImageUrls = uploadedUrls;

          // Reorder images to put main image first
          if (mainImageUrl && finalImageUrls.length > 1) {
            finalImageUrls = [
              mainImageUrl,
              ...finalImageUrls.filter((url) => url !== mainImageUrl)
            ];
          }

          // Update product with image URLs
          savedProduct = await this.productService.updateProduct({
            id: savedProduct.id,
            image_url: mainImageUrl || finalImageUrls[0] || null,
            image_urls: finalImageUrls.length > 0 ? finalImageUrls : null
          });
        }

        this.toastService.success('Product created', `${savedProduct.name} has been created.`);
      }

      this.saved.emit(savedProduct);
    } catch (error: any) {
      this.toastService.error('Save failed', error?.message ?? '');
    } finally {
      this.saving.set(false);
      this.uploading.set(false);
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
