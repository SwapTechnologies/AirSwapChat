import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatBadgeModule, MatBottomSheetModule, MatButtonModule, 
  MatCardModule, MatCheckboxModule, MatDialogModule, MatFormFieldModule, 
  MatIconModule, MatInputModule, MatListModule, MatProgressSpinnerModule,
  MatPaginatorModule, MatSelectModule, MatSidenavModule, MatSnackBarModule,
  MatTableModule, MatTabsModule, MatToolbarModule, 
  } from '@angular/material'
@NgModule({
  imports: [
    CommonModule,
    MatBadgeModule,
    MatBottomSheetModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule, 
    MatListModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSidenavModule,
    MatSnackBarModule,
    MatTableModule,
    MatTabsModule,
    MatToolbarModule
  ],
  exports: [
    MatBadgeModule,
    MatBottomSheetModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule, 
    MatListModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSidenavModule,
    MatSnackBarModule,
    MatTableModule,
    MatTabsModule,
    MatToolbarModule,
  ],
  declarations: [
  ]
})
export class NgMaterialModule { }
