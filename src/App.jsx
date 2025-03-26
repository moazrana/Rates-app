import { useState } from "react";
import * as XLSX from "xlsx";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RateTrackerTable from "./components/ui/table";
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

  const loadData = () => {
    fetch('/rates')
      .then((response) => response.json())
      .then((data) => {
        const formattedData = data.map((file, index) => ({
          id: Date.now() + index,
          name: file.name || "",
          company: file.company || "",
          packing: file.packing || "",
          specification: file.specification || "",
          rate: file.rate || "",
          date: file.date || "",
          rateBy: file.rateBy || "",
        }));
        setItems([...items, ...formattedData]);
      })
      .catch((error) => console.error('Error loading data:', error));
  }

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
          <div className="p-4">
          <h1 className="text-xl font-bold mb-4">Rate Tracker</h1>
          <button onClick={loadData}>Load Data</button>
          <RateTrackerTable items={items} />
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
