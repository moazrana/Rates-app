import { useState } from "react";
import * as XLSX from "xlsx";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import Select from './components/ui/select';
import './formStyle.css';

export default function RateTracker() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    type: "",
    name: "",
    company: "",
    packing: "",
    specification: "",
    rate: "",
    date: "",
    rateBy: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addItem = () => {
    setItems([...items, { ...form, id: Date.now() }]);
    setForm({ name: "", company: "", packing: "", specification: "", rate: "", date: "" });
  };

  const [selectedRateByValue, setSelectedRateByValue] = useState('');

  const rateByOptions = [
      { value: 'Shakeel Sab', label: 'Shakeel Sab' },
      { value: 'Rafaqat Sab', label: 'Rafaqat Sab' },
      { value: 'Lahore Sceitific Store', label: 'Lahore Sceitific Store' },
  ];

  const [selectedTypeValue, setSelectedTypeValue] = useState('');

  const typeOptions = [
      { value: 'Chemical', label: 'Chemical' },
      { value: 'Glassware', label: 'Glassware' },
  ];

  const handleTypeChange = (event) => {
    setSelectedTypeValue(event.target.value);
    setForm({ ...form, type: event.target.value });
  };

  const handleRateByChange = (event) => {
    setSelectedRateByValue(event.target.value);
    setForm({ ...form, rateBy: event.target.value });
  };

  // Function to handle Excel upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0]; // Read first sheet
      const sheet = workbook.Sheets[sheetName];
      const parsedData = XLSX.utils.sheet_to_json(sheet);

      const formattedData = parsedData.map((row, index) => ({
        id: Date.now() + index,
        name: row["Item Name"] || "",
        company: row["Company"] || "",
        packing: row["Packing"] || "",
        specification: row["Specification"] || "",
        rate: row["Rate"] || "",
        date: row["Date"] || "",
        rateBy: row["Rate By"] || "",
      }));

      setItems([...items, ...formattedData]);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="p-4">
      <Card className="p-4 mb-4">
        <h2 className="text-xl font-bold mb-2">Add Item Rate</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Item Type</Label>
            <Select
              options={typeOptions}
              value={selectedTypeValue}
              onChange={handleTypeChange}
              placeholder="Select Type"
            />
          </div>
          <div>
            <Label>Item Name</Label>
            <Input name="name" value={form.name} onChange={handleChange} />
          </div>
          <div>
            <Label>Company</Label>
            <Input name="company" value={form.company} onChange={handleChange} />
          </div>
          <div>
            <Label>Packing</Label>
            <Input name="packing" value={form.packing} onChange={handleChange} />
          </div>
          <div>
            <Label>Specification</Label>
            <Input name="specification" value={form.specification} onChange={handleChange} />
          </div>
          <div>
            <Label>Rate</Label>
            <Input name="rate" type="number" value={form.rate} onChange={handleChange} />
          </div>
          <div>
            <Label>Date</Label>
            <Input name="date" type="date" value={form.date} onChange={handleChange} />
          </div>
          <div>
            <Label>Rate By</Label>
            <Select
              options={rateByOptions}
              value={selectedRateByValue}
              onChange={handleRateByChange}
              placeholder="Select an option"
            />
          </div>
        </div>
        <Button className="mt-4" onClick={addItem}>Add Rate</Button>
      </Card>

      <Card className="p-4 mb-4">
        <h2 className="text-xl font-bold mb-2">Upload Excel File</h2>
        <Input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
      </Card>

      <Card>
        <CardContent>
          <h2 className="text-xl font-bold mb-2">Recorded Rates</h2>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Item</TableHeader>
                <TableHeader>Company</TableHeader>
                <TableHeader>Packing</TableHeader>
                <TableHeader>Specification</TableHeader>
                <TableHeader>Rate</TableHeader>
                <TableHeader>Date</TableHeader>
                <TableHeader>Rate By</TableHeader> 
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.company}</TableCell>
                  <TableCell>{item.packing}</TableCell>
                  <TableCell>{item.specification}</TableCell>
                  <TableCell>{item.rate}</TableCell>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{item.rateBy}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
