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
import { getDehumidifiers, createDehumidifier, updateDehumidifier, deleteDehumidifier, getStorageAreas } from '../api';

const statusOptions = [
  { value: 'running', label: '运行中' },
  { value: 'standby', label: '待机' },
  { value: 'maintenance', label: '维护中' },
  { value: 'error', label: '故障' },
];

const Dehumidifiers = () => {
  const [dehumidifiers, setDehumidifiers] = useState([]);
  const [storageAreas, setStorageAreas] = useState([]);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({ code: '', name: '', storage_area_id: '', status: 'running', target_humidity: 50 });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadData();
    loadStorageAreas();
  }, []);

  const loadData = async () => {
    try {
      const data = await getDehumidifiers();
      setDehumidifiers(data);
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
        status: item.status,
        target_humidity: item.target_humidity,
      });
    } else {
      setEditItem(null);
      setFormData({ code: '', name: '', storage_area_id: storageAreas[0]?.id || '', status: 'running', target_humidity: 50 });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditItem(null);
    setFormData({ code: '', name: '', storage_area_id: '', status: 'running', target_humidity: 50 });
  };

  const handleSubmit = async () => {
    try {
      if (editItem) {
        await updateDehumidifier(editItem.id, formData);
        showSnackbar('更新成功', 'success');
      } else {
        await createDehumidifier(formData);
        showSnackbar('创建成功', 'success');
      }
      handleClose();
      loadData();
    } catch (error) {
      showSnackbar(error.response?.data?.detail || '操作失败', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这个设备吗？')) {
      try {
        await deleteDehumidifier(id);
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
      case 'running': return 'success';
      case 'standby': return 'default';
      case 'maintenance': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">除湿设备</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          新增设备
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
                <TableCell>状态</TableCell>
                <TableCell>目标湿度</TableCell>
                <TableCell>当前湿度</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dehumidifiers.map((device) => (
                <TableRow key={device.id}>
                  <TableCell>{device.code}</TableCell>
                  <TableCell>{device.name}</TableCell>
                  <TableCell>{storageAreas.find((a) => a.id === device.storage_area_id)?.name || '-'}</TableCell>
                  <TableCell>
                    <Chip label={getStatusLabel(device.status)} size="small" color={getStatusColor(device.status)} />
                  </TableCell>
                  <TableCell>{device.target_humidity}%</TableCell>
                  <TableCell>{device.current_humidity !== null ? `${device.current_humidity}%` : '-'}</TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleOpen(device)}>
                      <Edit />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(device.id)} color="error">
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {dehumidifiers.length === 0 && (
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
        <DialogTitle>{editItem ? '编辑设备' : '新增设备'}</DialogTitle>
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
              label="目标湿度 (%)"
              type="number"
              value={formData.target_humidity}
              onChange={(e) => setFormData({ ...formData, target_humidity: parseFloat(e.target.value) || 50 })}
              fullWidth
              inputProps={{ min: 0, max: 100 }}
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

export default Dehumidifiers;
