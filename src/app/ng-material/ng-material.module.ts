import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatBadgeModule, MatBottomSheetModule, MatButtonModule, 
  MatCardModule, MatCheckboxModule, MatDialogModule, MatFormFieldModule, 
  MatIconModule, MatInputModule, MatListModule, MatPaginatorModule, MatSelectModule,
  MatSidenavModule, MatSnackBarModule, MatTabsModule, MatToolbarModule, 
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
    MatSelectModule,
    MatSidenavModule,
    MatSnackBarModule,
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
    MatSelectModule,
    MatSidenavModule,
    MatSnackBarModule,
    MatTabsModule,
    MatToolbarModule,
  ],
  declarations: [
  ]
})
export class NgMaterialModule { }
