import { Component, OnInit } from '@angular/core';
import { Invoice, InvoiceService, BookingOption } from '../services/invoice.service';

@Component({
  selector: 'app-invoices',
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.css']
})
export class InvoicesComponent implements OnInit {
  invoices: Invoice[] = [];
  bookingOptions: BookingOption[] = [];
  searchTerm = '';
  isLoading = true;
  errorMessage = '';

  showForm = false;
  editingId: number | null = null;
  formModel: Invoice = this.emptyInvoice();

  constructor(private invoiceService: InvoiceService) {}

  ngOnInit(): void {
    this.loadInvoices();
    this.loadBookingOptions();
  }

  emptyInvoice(): Invoice {
    return {
      BookingId: 0,
      InvoiceNumber: '',
      InvoiceDate: new Date().toISOString().substring(0, 10),
      Amount: 0,
      PaymentStatus: 'Unpaid'
    };
  }

  loadInvoices(): void {
    this.isLoading = true;
    this.invoiceService.getAll(this.searchTerm).subscribe({
      next: (data) => { this.invoices = data; this.isLoading = false; },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Could not load invoices.';
        this.isLoading = false;
      }
    });
  }

  loadBookingOptions(): void {
    this.invoiceService.getBookingOptions().subscribe({
      next: (data) => { this.bookingOptions = data; },
      error: () => { /* non-critical - the form will just show an empty dropdown */ }
    });
  }

  onSearch(): void {
    this.loadInvoices();
  }

  openAddForm(): void {
    this.editingId = null;
    this.formModel = this.emptyInvoice();
    this.showForm = true;
  }

  openEditForm(invoice: Invoice): void {
    this.editingId = invoice.InvoiceId!;
    this.formModel = { ...invoice, InvoiceDate: invoice.InvoiceDate.substring(0, 10) };
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
  }

  saveInvoice(): void {
    this.errorMessage = '';

    if (!this.formModel.BookingId) {
      this.errorMessage = 'Please choose which booking this invoice belongs to.';
      return;
    }

    const request = this.editingId
      ? this.invoiceService.update(this.editingId, this.formModel)
      : this.invoiceService.create(this.formModel);

    request.subscribe({
      next: () => {
        this.showForm = false;
        this.loadInvoices();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Could not save invoice.';
      }
    });
  }

  deleteInvoice(invoice: Invoice): void {
    const confirmed = window.confirm(`Delete invoice "${invoice.InvoiceNumber}"?`);
    if (!confirmed) return;

    this.invoiceService.delete(invoice.InvoiceId!).subscribe({
      next: () => this.loadInvoices(),
      error: (err) => {
        this.errorMessage = err.error?.message || 'Could not delete invoice.';
      }
    });
  }
}
