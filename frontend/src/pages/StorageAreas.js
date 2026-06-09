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
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { getStorageAreas, createStorageArea, updateStorageArea, deleteStorageArea } from '../api';

const StorageAreas = () => {
  const [areas, setAreas] = useState([]);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '', floor: 0 });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getStorageAreas();
      setAreas(data);
    } catch (error) {
      showSnackbar('加载数据失败', 'error');
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
      setFormData({ name: item.name, code: item.code, description: item.description || '', floor: item.floor || 0 });
    } else {
      setEditItem(null);
      setFormData({ name: '', code: '', description: '', floor: 0 });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditItem(null);
    setFormData({ name: '', code: '', description: '', floor: 0 });
  };

  const handleSubmit = async () => {
    try {
      if (editItem) {
        await updateStorageArea(editItem.id, formData);
        showSnackbar('更新成功', 'success');
      } else {
        await createStorageArea(formData);
        showSnackbar('创建成功', 'success');
      }
      handleClose();
      loadData();
    } catch (error) {
      showSnackbar(error.response?.data?.detail || '操作失败', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这个库区吗？')) {
      try {
        await deleteStorageArea(id);
        showSnackbar('删除成功', 'success');
        loadData();
      } catch (error) {
        showSnackbar('删除失败', 'error');
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">库区管理</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          新增库区
        </Button>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>编码</TableCell>
                <TableCell>名称</TableCell>
                <TableCell>楼层</TableCell>
                <TableCell>描述</TableCell>
                <TableCell>创建时间</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {areas.map((area) => (
                <TableRow key={area.id}>
                  <TableCell>{area.code}</TableCell>
                  <TableCell>{area.name}</TableCell>
                  <TableCell>{area.floor}</TableCell>
                  <TableCell>{area.description || '-'}</TableCell>
                  <TableCell>{new Date(area.created_at).toLocaleString()}</TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleOpen(area)}>
                      <Edit />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(area.id)} color="error">
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {areas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    暂无数据
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? '编辑库区' : '新增库区'}</DialogTitle>
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
              label="楼层"
              type="number"
              value={formData.floor}
              onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 0 })}
              fullWidth
            />
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

export default StorageAreas;
