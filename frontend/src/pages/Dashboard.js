import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Button,
  IconButton,
  Tooltip as MuiTooltip,
} from '@mui/material';
import {
  Warehouse,
  MenuBook,
  Opacity,
  Assignment,
  Warning,
  CheckCircle,
  Error,
  SwapHoriz,
  PriorityHigh,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getDashboard } from '../api';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateMoveTask = (riskItem) => {
    const params = new URLSearchParams({
      bookshelf_id: riskItem.bookshelf_id,
      bookshelf_code: riskItem.bookshelf_code,
      area_id: riskItem.area_id,
      area_name: riskItem.area_name,
      humidity: riskItem.humidity,
      temperature: riskItem.temperature,
      mold_level: riskItem.mold_level,
      has_odor: riskItem.has_odor,
      has_pest: riskItem.has_pest,
      risk_description: riskItem.risk_description,
      source_location: riskItem.area_name,
    });
    navigate(`/move-tasks?${params.toString()}`);
  };

  const loadData = async () => {
    try {
      const result = await getDashboard();
      setData(result);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHumidityColor = (humidity) => {
    if (humidity < 45) return '#4caf50';
    if (humidity < 60) return '#ff9800';
    return '#f44336';
  };

  const getMoldLevelColor = (level) => {
    if (level === 0) return '#4caf50';
    if (level <= 2) return '#ff9800';
    return '#f44336';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'success';
      case 'maintenance': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'running': return '运行中';
      case 'maintenance': return '维护中';
      case 'error': return '故障';
      default: return status;
    }
  };

  const getTaskStatusText = (status) => {
    switch (status) {
      case 'pending': return '待开始';
      case 'in_progress': return '进行中';
      case 'completed': return '已完成';
      default: return status;
    }
  };

  if (loading) {
    return <LinearProgress />;
  }

  const stats = data?.stats || { total_areas: 0, total_bookshelves: 0, active_devices: 0, pending_tasks: 0 };
  const humidityHeatmap = data?.humidity_heatmap || [];
  const moldRisks = data?.mold_risks || [];
  const moveProgress = data?.move_progress || [];
  const deviceAlerts = data?.device_alerts || [];
  const riskInspections = data?.risk_inspections || [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        首页概览
      </Typography>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" color="text.secondary">
                    库区总数
                  </Typography>
                  <Typography variant="h3" component="div">
                    {stats.total_areas}
                  </Typography>
                </Box>
                <Warehouse sx={{ fontSize: 60, color: 'primary.main', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" color="text.secondary">
                    书架总数
                  </Typography>
                  <Typography variant="h3" component="div">
                    {stats.total_bookshelves}
                  </Typography>
                </Box>
                <MenuBook sx={{ fontSize: 60, color: 'success.main', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" color="text.secondary">
                    运行设备
                  </Typography>
                  <Typography variant="h3" component="div">
                    {stats.active_devices}
                  </Typography>
                </Box>
                <Opacity sx={{ fontSize: 60, color: 'info.main', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" color="text.secondary">
                    待处理任务
                  </Typography>
                  <Typography variant="h3" component="div">
                    {stats.pending_tasks}
                  </Typography>
                </Box>
                <Assignment sx={{ fontSize: 60, color: 'warning.main', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              库区湿度热力图
            </Typography>
            {humidityHeatmap.length > 0 ? (
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={humidityHeatmap} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} unit="%" />
                    <YAxis dataKey="area_name" type="category" width={100} />
                    <Tooltip formatter={(value) => [`${value}%`, '湿度']} />
                    <Bar dataKey="avg_humidity" name="平均湿度" radius={[0, 4, 4, 0]}>
                      {humidityHeatmap.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getHumidityColor(entry.avg_humidity)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Alert severity="info">暂无湿度数据，请先添加巡检记录</Alert>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              霉斑风险预警
            </Typography>
            {moldRisks.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>书架编号</TableCell>
                      <TableCell>所属库区</TableCell>
                      <TableCell>霉斑等级</TableCell>
                      <TableCell>当前湿度</TableCell>
                      <TableCell>异味</TableCell>
                      <TableCell>虫害</TableCell>
                      <TableCell>风险说明</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {moldRisks.map((item) => (
                      <TableRow key={item.bookshelf_id}>
                        <TableCell>{item.bookshelf_code}</TableCell>
                        <TableCell>{item.area_name}</TableCell>
                        <TableCell>
                          <Chip
                            label={`${item.mold_level}级`}
                            size="small"
                            sx={{ bgcolor: getMoldLevelColor(item.mold_level), color: 'white' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${item.humidity}%`}
                            size="small"
                            sx={{ bgcolor: getHumidityColor(item.humidity), color: 'white' }}
                          />
                        </TableCell>
                        <TableCell>
                          {item.has_odor ? (
                            <Chip label="有" size="small" color="error" />
                          ) : (
                            <Chip label="无" size="small" color="success" />
                          )}
                        </TableCell>
                        <TableCell>
                          {item.has_pest ? (
                            <Chip label="有" size="small" color="error" />
                          ) : (
                            <Chip label="无" size="small" color="success" />
                          )}
                        </TableCell>
                        <TableCell sx={{ maxWidth: 200 }}>
                          <MuiTooltip title={item.risk_description}>
                            <Typography variant="body2" noWrap>
                              {item.risk_description}
                            </Typography>
                          </MuiTooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="success" icon={<CheckCircle />}>
                当前无风险预警
              </Alert>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              移架任务进度
            </Typography>
            {moveProgress.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>书架编号</TableCell>
                      <TableCell>负责人</TableCell>
                      <TableCell>状态</TableCell>
                      <TableCell>进度</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {moveProgress.map((item) => (
                      <TableRow key={item.task_id}>
                        <TableCell>{item.bookshelf_code}</TableCell>
                        <TableCell>{item.responsible_person}</TableCell>
                        <TableCell>
                          <Chip
                            label={getTaskStatusText(item.status)}
                            size="small"
                            color={item.status === 'completed' ? 'success' : item.status === 'in_progress' ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell sx={{ width: 150 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={item.progress}
                                color={item.progress === 100 ? 'success' : 'primary'}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {item.progress}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">暂无移架任务</Alert>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              设备异常告警
            </Typography>
            {deviceAlerts.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>设备编号</TableCell>
                      <TableCell>设备名称</TableCell>
                      <TableCell>所属库区</TableCell>
                      <TableCell>状态</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {deviceAlerts.map((item) => (
                      <TableRow key={item.device_id}>
                        <TableCell>{item.device_code}</TableCell>
                        <TableCell>{item.device_name}</TableCell>
                        <TableCell>{item.area_name}</TableCell>
                        <TableCell>
                          <Chip
                            icon={item.status === 'error' ? <Error /> : <Warning />}
                            label={getStatusText(item.status)}
                            size="small"
                            color={getStatusColor(item.status)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="success" icon={<CheckCircle />}>
                所有设备运行正常
              </Alert>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                风险巡检转移架建议
              </Typography>
              <Chip
                icon={<PriorityHigh />}
                label={`${riskInspections.length} 项需处理`}
                color="error"
                size="small"
              />
            </Box>
            {riskInspections.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>书架编号</TableCell>
                      <TableCell>书架名称</TableCell>
                      <TableCell>所属库区</TableCell>
                      <TableCell>湿度</TableCell>
                      <TableCell>霉斑等级</TableCell>
                      <TableCell>异味</TableCell>
                      <TableCell>虫害</TableCell>
                      <TableCell>风险说明</TableCell>
                      <TableCell>状态</TableCell>
                      <TableCell align="center">操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {riskInspections.map((item) => (
                      <TableRow key={item.bookshelf_id} sx={{ bgcolor: 'error.lighter' }}>
                        <TableCell>{item.bookshelf_code}</TableCell>
                        <TableCell>{item.bookshelf_name}</TableCell>
                        <TableCell>{item.area_name}</TableCell>
                        <TableCell>
                          <Chip
                            label={`${item.humidity}%`}
                            size="small"
                            sx={{ bgcolor: getHumidityColor(item.humidity), color: 'white' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${item.mold_level}级`}
                            size="small"
                            sx={{ bgcolor: getMoldLevelColor(item.mold_level), color: 'white' }}
                          />
                        </TableCell>
                        <TableCell>
                          {item.has_odor ? (
                            <Chip label="有" size="small" color="error" />
                          ) : (
                            <Chip label="无" size="small" color="success" />
                          )}
                        </TableCell>
                        <TableCell>
                          {item.has_pest ? (
                            <Chip label="有" size="small" color="error" />
                          ) : (
                            <Chip label="无" size="small" color="success" />
                          )}
                        </TableCell>
                        <TableCell sx={{ maxWidth: 200 }}>
                          <MuiTooltip title={item.risk_description}>
                            <Typography variant="body2" noWrap>
                              {item.risk_description}
                            </Typography>
                          </MuiTooltip>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<PriorityHigh />}
                            label="建议处理"
                            size="small"
                            color="error"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <MuiTooltip title="一键发起移架任务">
                            <Button
                              variant="contained"
                              size="small"
                              color="primary"
                              startIcon={<SwapHoriz />}
                              onClick={() => handleCreateMoveTask(item)}
                            >
                              发起移架
                            </Button>
                          </MuiTooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="success" icon={<CheckCircle />}>
                当前无需要移架的风险项
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
