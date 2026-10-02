import { Component, OnInit } from '@angular/core';
import { Booking, BookingService } from '../services/booking.service';

@Component({
  selector: 'app-bookings',
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.css']
})
export class BookingsComponent implements OnInit {
  bookings: Booking[] = [];
  searchTerm = '';
  isLoading = true;
  errorMessage = '';

  // Controls whether the add/edit form is visible, and what it's editing.
  showForm = false;
  editingId: number | null = null;
  formModel: Booking = this.emptyBooking();

  constructor(private bookingService: BookingService) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  emptyBooking(): Booking {
    return {
      ClientName: '',
      MediaChannel: 'Digital',
      Campaign: '',
      BookingDate: new Date().toISOString().substring(0, 10),
      Amount: 0,
      Status: 'Pending'
    };
  }

  loadBookings(): void {
    this.isLoading = true;
    this.bookingService.getAll(this.searchTerm).subscribe({
      next: (data) => { this.bookings = data; this.isLoading = false; },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Could not load bookings.';
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.loadBookings();
  }

  openAddForm(): void {
    this.editingId = null;
    this.formModel = this.emptyBooking();
    this.showForm = true;
  }

  openEditForm(booking: Booking): void {
    this.editingId = booking.BookingId!;
    // Date input needs "yyyy-MM-dd" - trim off any time portion.
    this.formModel = { ...booking, BookingDate: booking.BookingDate.substring(0, 10) };
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
  }

  saveBooking(): void {
    this.errorMessage = '';

    const request = this.editingId
      ? this.bookingService.update(this.editingId, this.formModel)
      : this.bookingService.create(this.formModel);

    request.subscribe({
      next: () => {
        this.showForm = false;
        this.loadBookings();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Could not save booking.';
      }
    });
  }

  deleteBooking(booking: Booking): void {
    const confirmed = window.confirm(`Delete the booking for "${booking.ClientName}"?`);
    if (!confirmed) return;

    this.bookingService.delete(booking.BookingId!).subscribe({
      next: () => this.loadBookings(),
      error: (err) => {
        this.errorMessage = err.error?.message || 'Could not delete booking.';
      }
    });
  }
}
