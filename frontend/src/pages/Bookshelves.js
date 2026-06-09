import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  MenuItem,
  Chip,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { getBookshelves, createBookshelf, updateBookshelf, deleteBookshelf, getStorageAreas } from '../api';

const statusOptions = [
  { value: 'normal', label: '正常' },
  { value: 'maintenance', label: '维护中' },
  { value: 'moving', label: '移动中' },
];

const Bookshelves = () => {
  const [bookshelves, setBookshelves] = useState([]);
  const [storageAreas, setStorageAreas] = useState([]);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({ code: '', name: '', storage_area_id: '', row: 0, column: 0, status: 'normal', description: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadData();
    loadStorageAreas();
  }, []);

  const loadData = async () => {
    try {
      const data = await getBookshelves();
      setBookshelves(data);
    } catch (error) {
      showSnackbar('加载数据失败', 'error');
    }
  };

  const loadStorageAreas = async () => {
    try {
      const data = await getStorageAreas();
      setStorageAreas(data);
    } catch (error) {
      console.error('Failed to load storage areas:', error);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpen = (item = null) => {
    if (item) {
      setEditItem(item);
      setFormData({
        code: item.code,
        name: item.name,
        storage_area_id: item.storage_area_id,
        row: item.row,
        column: item.column,
        status: item.status,
        description: item.description || '',
      });
    } else {
      setEditItem(null);
      setFormData({ code: '', name: '', storage_area_id: storageAreas[0]?.id || '', row: 0, column: 0, status: 'normal', description: '' });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditItem(null);
    setFormData({ code: '', name: '', storage_area_id: '', row: 0, column: 0, status: 'normal', description: '' });
  };

  const handleSubmit = async () => {
    try {
      if (editItem) {
        await updateBookshelf(editItem.id, formData);
        showSnackbar('更新成功', 'success');
      } else {
        await createBookshelf(formData);
        showSnackbar('创建成功', 'success');
      }
      handleClose();
      loadData();
    } catch (error) {
      showSnackbar(error.response?.data?.detail || '操作失败', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这个书架吗？')) {
      try {
        await deleteBookshelf(id);
        showSnackbar('删除成功', 'success');
        loadData();
      } catch (error) {
        showSnackbar('删除失败', 'error');
      }
    }
  };

  const getStatusLabel = (status) => {
    const option = statusOptions.find((o) => o.value === status);
    return option ? option.label : status;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'normal': return 'success';
      case 'maintenance': return 'warning';
      case 'moving': return 'primary';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">书架管理</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          新增书架
        </Button>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>编码</TableCell>
                <TableCell>名称</TableCell>
                <TableCell>所属库区</TableCell>
                <TableCell>排</TableCell>
                <TableCell>列</TableCell>
                <TableCell>状态</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookshelves.map((shelf) => (
                <TableRow key={shelf.id}>
                  <TableCell>{shelf.code}</TableCell>
                  <TableCell>{shelf.name}</TableCell>
                  <TableCell>{storageAreas.find((a) => a.id === shelf.storage_area_id)?.name || '-'}</TableCell>
                  <TableCell>{shelf.row}</TableCell>
                  <TableCell>{shelf.column}</TableCell>
                  <TableCell>
                    <Chip label={getStatusLabel(shelf.status)} size="small" color={getStatusColor(shelf.status)} />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleOpen(shelf)}>
                      <Edit />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(shelf.id)} color="error">
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {bookshelves.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    暂无数据
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? '编辑书架' : '新增书架'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="编码"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="名称"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              select
              label="所属库区"
              value={formData.storage_area_id}
              onChange={(e) => setFormData({ ...formData, storage_area_id: parseInt(e.target.value) })}
              fullWidth
              required
            >
              {storageAreas.map((area) => (
                <MenuItem key={area.id} value={area.id}>
                  {area.name}
                </MenuItem>
              ))}
            </TextField>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="排"
                type="number"
                value={formData.row}
                onChange={(e) => setFormData({ ...formData, row: parseInt(e.target.value) || 0 })}
                fullWidth
              />
              <TextField
                label="列"
                type="number"
                value={formData.column}
                onChange={(e) => setFormData({ ...formData, column: parseInt(e.target.value) || 0 })}
                fullWidth
              />
            </Box>
            <TextField
              select
              label="状态"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              fullWidth
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="描述"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>取消</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editItem ? '更新' : '创建'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Bookshelves;
