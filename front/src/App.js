import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import Container from '@mui/material/Container';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import ButtonGroup from '@mui/material/ButtonGroup';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

const VIEWS = {
  LIST: 'list',
  STOCK: 'stock',
  NEW: 'new'
};

function App() {
    const [view, setView] = useState(VIEWS.LIST);
    const [items, setItems] = useState([]);
    const [locations, setLocations] = useState([]);
    const [query, setQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [form, setForm] = useState({ item_id: '1', location_id: '1', type: 'in', qty: 0 });
    const [selectedLocation, setSelectedLocation] = useState('1');
    const [newItem, setNewItem] = useState({ code: '', name: '', category: '' });
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  useEffect(() => {
    fetchItems();
    fetchLocations();
  }, []);

  const fetchItems = async () => {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (filterCategory) params.append('category', filterCategory);
    if (selectedLocation) params.append('location_id', selectedLocation);
    const res = await fetch(`http://localhost:5000/items?${params.toString()}`);
    const data = await res.json();
    setItems(data);
  };

  const fetchLocations = async () => {
    const res = await fetch('http://localhost:5000/locations');
    const data = await res.json();
    setLocations(data);
  };

  const handleSearch = e => {
    e.preventDefault();
    fetchItems();
  };

  const handleStockSubmit = async e => {
    e.preventDefault();
    setMessage('');
    const res = await fetch('http://localhost:5000/stock_logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (res.ok) {
      toast.success('入出庫に成功しました', { autoClose: 5000 });
      setForm({ item_id: '', location_id: '', type: 'in', qty: 0 });
    } else {
      toast.error('入出庫に失敗しました', { autoClose: 5000 });
    }
  };

  const handleNewItemSubmit = async e => {
    e.preventDefault();
    setMessage('');
    const res = await fetch('http://localhost:5000/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem)
    });
    const data = await res.json();
    if (res.ok) {
      toast.success('品番登録に成功しました', { autoClose: 5000 });
      setNewItem({ code: '', name: '', category: '' });
      fetchItems();
    } else {
      toast.error('品番登録に失敗しました', { autoClose: 5000 });
    }
  };

const categories = Array.from(new Set(items.map(item => item.category)));
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <AppBar position="sticky" color="primary" elevation={4} sx={{ mb: 2, top: 0 }}>
        <Toolbar>
          <Typography variant="h6" component="div">
            在庫管理アプリ
          </Typography>
          <ButtonGroup variant="outlined" color="inherit" sx={{ ml: 'auto', borderColor: 'rgba(255,255,255,0.7)' }}>
            <Button onClick={() => setView(VIEWS.LIST)} startIcon={<ListAltIcon />} variant="outlined" color="inherit" sx={{ borderColor: 'rgba(255,255,255,0.7)' }}>
              在庫一覧
            </Button>
            <Button onClick={() => setView(VIEWS.STOCK)} startIcon={<SwapHorizIcon />} variant="outlined" color="inherit" sx={{ borderColor: 'rgba(255,255,255,0.7)' }}>
              入出庫
            </Button>
            <Button onClick={() => setView(VIEWS.NEW)} startIcon={<AddCircleOutlineIcon />} variant="outlined" color="inherit" sx={{ borderColor: 'rgba(255,255,255,0.7)' }}>
              新規登録
            </Button>
          </ButtonGroup>
        </Toolbar>
      </AppBar>
      {message && <div className={`message ${messageType}`}>{message}</div>}
      <ToastContainer autoClose={5000} />
      {view === VIEWS.LIST && (
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
          <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              label="品番・品名で検索"
              variant="outlined"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <FormControl variant="outlined" sx={{ minWidth: 120 }}>
              <InputLabel>カテゴリ</InputLabel>
              <Select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                label="カテゴリ"
              >
                <MenuItem value="">すべて</MenuItem>
                {categories.map(cat => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl variant="outlined" sx={{ minWidth: 120 }}>
              <InputLabel>拠点</InputLabel>
              <Select
                value={selectedLocation}
                onChange={e => setSelectedLocation(e.target.value)}
                label="拠点"
              >
                {locations.map(loc => (
                  <MenuItem key={loc.id} value={loc.id}>{loc.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button type="submit" variant="contained">検索</Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>品番</TableCell>
                  <TableCell>品名</TableCell>
                  <TableCell>カテゴリ</TableCell>
                  <TableCell>在庫数</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.code}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.stock}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
      {view === VIEWS.STOCK && (
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
          <Box component="form" onSubmit={handleStockSubmit} sx={{ display: 'grid', gap: 2, mb: 2, gridTemplateColumns: '1fr' }}>
            <FormControl variant="outlined" fullWidth>
              <InputLabel>品番選択</InputLabel>
              <Select
                value={form.item_id}
                onChange={e => setForm({ ...form, item_id: e.target.value })}
                label="品番選択"
              >
                {items.map(item => (
                  <MenuItem key={item.id} value={item.id}>{item.code} - {item.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl variant="outlined" fullWidth>
              <InputLabel>拠点選択</InputLabel>
              <Select
                value={form.location_id}
                onChange={e => setForm({ ...form, location_id: e.target.value })}
                label="拠点選択"
              >
                {locations.map(loc => (
                  <MenuItem key={loc.id} value={loc.id}>{loc.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl variant="outlined" sx={{ width: 120 }}>
              <InputLabel>入出庫</InputLabel>
              <Select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                label="入出庫"
              >
                <MenuItem value="in">入庫</MenuItem>
                <MenuItem value="out">出庫</MenuItem>
              </Select>
            </FormControl>
            <TextField
              type="number"
              label="数量"
              variant="outlined"
              InputProps={{ inputProps: { min: 1 } }}
              value={form.qty}
              onChange={e => setForm({ ...form, qty: Number(e.target.value) })}
              sx={{ width: 120 }}
            />
            <Button type="submit" variant="contained" disabled={form.qty <= 0}>実行</Button>
          </Box>
        </Paper>
      )}
      {view === VIEWS.NEW && (
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
          <Box component="form" onSubmit={handleNewItemSubmit} sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              label="品番"
              variant="outlined"
              value={newItem.code}
              onChange={e => setNewItem({ ...newItem, code: e.target.value })}
            />
            <TextField
              label="品名"
              variant="outlined"
              value={newItem.name}
              onChange={e => setNewItem({ ...newItem, name: e.target.value })}
            />
            <TextField
              label="カテゴリ"
              variant="outlined"
              value={newItem.category}
              onChange={e => setNewItem({ ...newItem, category: e.target.value })}
            />
            <Button type="submit" variant="contained">登録</Button>
          </Box>
        </Paper>
      )}
    </Container>
  );
}

export default App;