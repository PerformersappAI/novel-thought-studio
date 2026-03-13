import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2, Printer } from "lucide-react";

interface LineItem {
  description: string;
  rate: string;
  quantity: string;
}

const InvoiceBuilder = () => {
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("INV-001");
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ description: "", rate: "", quantity: "1" }]);

  const addItem = () => setItems([...items, { description: "", rate: "", quantity: "1" }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof LineItem, value: string) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: value };
    setItems(updated);
  };

  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.rate) || 0) * (parseFloat(item.quantity) || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container px-4 pt-24 pb-16 max-w-4xl">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/tools"><ArrowLeft className="w-4 h-4 mr-1" /> Back to Tools</Link>
        </Button>
        <h1 className="font-display text-3xl font-bold mb-2">Invoice Builder</h1>
        <p className="text-muted-foreground mb-8">Build professional invoices for your creative and performance work.</p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-4">
            <Card className="p-6 space-y-4">
              <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wide">Client Info</h3>
              <Input placeholder="Client name" value={clientName} onChange={(e) => setClientName(e.target.value)} />
              <Input placeholder="Client email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Invoice #" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </Card>
            <Card className="p-6 space-y-3">
              <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wide">Line Items</h3>
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <Input placeholder="Description" value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} className="flex-1" />
                  <Input placeholder="Rate" value={item.rate} onChange={(e) => updateItem(i, "rate", e.target.value)} className="w-24" />
                  <Input placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} className="w-16" />
                  {items.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeItem(i)} className="shrink-0"><Trash2 className="w-4 h-4" /></Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addItem}><Plus className="w-3 h-3 mr-1" /> Add Item</Button>
            </Card>
          </div>

          {/* Preview */}
          <Card className="p-8 bg-card" id="invoice-preview">
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">INVOICE</h2>
                  <p className="text-sm text-muted-foreground">{invoiceNumber}</p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>Date: {new Date().toLocaleDateString()}</p>
                  {dueDate && <p>Due: {new Date(dueDate).toLocaleDateString()}</p>}
                </div>
              </div>

              {clientName && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Bill To</p>
                  <p className="font-medium text-foreground">{clientName}</p>
                  {clientEmail && <p className="text-sm text-muted-foreground">{clientEmail}</p>}
                </div>
              )}

              <div className="border-t border-border pt-4">
                <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  <div className="col-span-6">Description</div>
                  <div className="col-span-3 text-right">Rate</div>
                  <div className="col-span-1 text-right">Qty</div>
                  <div className="col-span-2 text-right">Amount</div>
                </div>
                {items.filter(i => i.description).map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 text-sm py-2 border-b border-border/30">
                    <div className="col-span-6 text-foreground">{item.description}</div>
                    <div className="col-span-3 text-right text-muted-foreground">${parseFloat(item.rate || "0").toFixed(2)}</div>
                    <div className="col-span-1 text-right text-muted-foreground">{item.quantity}</div>
                    <div className="col-span-2 text-right text-foreground font-medium">${((parseFloat(item.rate) || 0) * (parseFloat(item.quantity) || 0)).toFixed(2)}</div>
                  </div>
                ))}
                <div className="flex justify-end pt-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-display font-bold text-foreground">${subtotal.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="mt-6 w-full" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" /> Print Invoice
            </Button>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default InvoiceBuilder;
