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
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { getSensorPoints, createSensorPoint, updateSensorPoint, deleteSensorPoint, getStorageAreas } from '../api';

const SensorPoints = () => {
  const [sensorPoints, setSensorPoints] = useState([]);
  const [storageAreas, setStorageAreas] = useState([]);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({ code: '', name: '', storage_area_id: '', location: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadData();
    loadStorageAreas();
  }, []);

  const loadData = async () => {
    try {
      const data = await getSensorPoints();
      setSensorPoints(data);
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
        location: item.location,
      });
    } else {
      setEditItem(null);
      setFormData({ code: '', name: '', storage_area_id: storageAreas[0]?.id || '', location: '' });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditItem(null);
    setFormData({ code: '', name: '', storage_area_id: '', location: '' });
  };

  const handleSubmit = async () => {
    try {
      if (editItem) {
        await updateSensorPoint(editItem.id, formData);
        showSnackbar('更新成功', 'success');
      } else {
        await createSensorPoint(formData);
        showSnackbar('创建成功', 'success');
      }
      handleClose();
      loadData();
    } catch (error) {
      showSnackbar(error.response?.data?.detail || '操作失败', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这个采集点吗？')) {
      try {
        await deleteSensorPoint(id);
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
        <Typography variant="h4">温湿度采集点</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          新增采集点
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
                <TableCell>位置</TableCell>
                <TableCell>最新温度</TableCell>
                <TableCell>最新湿度</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sensorPoints.map((sensor) => (
                <TableRow key={sensor.id}>
                  <TableCell>{sensor.code}</TableCell>
                  <TableCell>{sensor.name}</TableCell>
                  <TableCell>{storageAreas.find((a) => a.id === sensor.storage_area_id)?.name || '-'}</TableCell>
                  <TableCell>{sensor.location}</TableCell>
                  <TableCell>{sensor.last_temperature !== null ? `${sensor.last_temperature}°C` : '-'}</TableCell>
                  <TableCell>{sensor.last_humidity !== null ? `${sensor.last_humidity}%` : '-'}</TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleOpen(sensor)}>
                      <Edit />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(sensor.id)} color="error">
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {sensorPoints.length === 0 && (
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
        <DialogTitle>{editItem ? '编辑采集点' : '新增采集点'}</DialogTitle>
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
              label="位置描述"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              fullWidth
              required
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

export default SensorPoints;
