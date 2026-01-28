import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { AuditLogResponse, PagedAuditLogResponse } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, User, FileText, ChevronLeft, ChevronRight, Download, X, Eye } from 'lucide-react';
import { PMNavigationHeader } from '@/components/PMNavigationHeader';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function PMAuditLogPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [logs, setLogs] = useState<AuditLogResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 100; // 최대 100개까지 한 페이지에 표시

  // Filters
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Detail dialog
  const [selectedLog, setSelectedLog] = useState<AuditLogResponse | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Entity types (will be populated from API)
  const [entityTypes, setEntityTypes] = useState<string[]>([]);

  useEffect(() => {
    fetchEntityTypes();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [currentPage, actionTypeFilter, entityTypeFilter, searchQuery, startDate, endDate]);

  const fetchEntityTypes = async () => {
    try {
      const stats = await api.auditLog.getStatsByEntityType();
      setEntityTypes(Object.keys(stats));
    } catch (error) {
      // Ignore error, use empty list
    }
  };

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      // Convert datetime-local format to ISO format for API
      const isoStartDate = startDate ? convertToISOFormat(startDate) : undefined;
      const isoEndDate = endDate ? convertToISOFormat(endDate) : undefined;
      
      // Convert "all" to undefined for API
      const actionType = actionTypeFilter === 'all' ? undefined : actionTypeFilter;
      const entityType = entityTypeFilter === 'all' ? undefined : entityTypeFilter;
      
      const response: PagedAuditLogResponse = await api.auditLog.searchLogs(
        actionType,
        entityType,
        searchQuery || undefined,
        isoStartDate,
        isoEndDate,
        currentPage,
        pageSize
      );
      setLogs(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      toast({
        title: 'Audit Log 로드 실패',
        description: error instanceof Error ? error.message : '로그를 불러올 수 없습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      toast({
        title: 'CSV 내보내기',
        description: '파일을 생성하는 중입니다...',
      });

      // Convert datetime-local format to ISO format for API
      const isoStartDate = startDate ? convertToISOFormat(startDate) : undefined;
      const isoEndDate = endDate ? convertToISOFormat(endDate) : undefined;
      
      // Convert "all" to undefined for API
      const actionType = actionTypeFilter === 'all' ? undefined : actionTypeFilter;
      const entityType = entityTypeFilter === 'all' ? undefined : entityTypeFilter;
      
      await api.auditLog.exportToCsv(
        actionType,
        entityType,
        searchQuery || undefined,
        isoStartDate,
        isoEndDate
      );

      toast({
        title: '내보내기 완료',
        description: 'CSV 파일이 다운로드되었습니다.',
      });
    } catch (error) {
      toast({
        title: '내보내기 실패',
        description: error instanceof Error ? error.message : 'CSV 내보내기에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleClearFilters = () => {
    setActionTypeFilter('all');
    setEntityTypeFilter('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(0);
  };

  const handleViewDetail = (log: AuditLogResponse) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  const getActionTypeBadge = (actionType: string) => {
    const variants: Record<string, { variant: 'default' | 'destructive' | 'secondary' | 'outline', color: string }> = {
      CREATE: { variant: 'default', color: 'bg-green-500' },
      UPDATE: { variant: 'secondary', color: 'bg-blue-500' },
      DELETE: { variant: 'destructive', color: 'bg-red-500' },
      ASSIGN: { variant: 'outline', color: 'bg-purple-500' },
      EXPORT: { variant: 'outline', color: 'bg-orange-500' },
      IMPORT: { variant: 'outline', color: 'bg-yellow-500' },
    };

    const config = variants[actionType] || { variant: 'outline' as const, color: 'bg-gray-500' };

    return (
      <Badge variant={config.variant} className={`${config.color} text-white`}>
        {actionType}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Convert datetime-local format to ISO 8601 format for API
  const convertToISOFormat = (dateTimeLocal: string): string => {
    if (!dateTimeLocal) return '';
    // datetime-local format: "2024-01-01T12:00"
    // ISO format: "2024-01-01T12:00:00"
    // If seconds are missing, add ":00"
    if (dateTimeLocal.length === 16) {
      return dateTimeLocal + ':00';
    }
    return dateTimeLocal;
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const hasActiveFilters = actionTypeFilter !== 'all' || entityTypeFilter !== 'all' || startDate || endDate;

  return (
    <div className="container mx-auto p-2 sm:p-4 lg:p-6 max-w-[1600px]">
      <PMNavigationHeader
        title="Audit Log"
        description="PM이 수행한 모든 작업 내역을 확인할 수 있습니다."
      >
        <Button variant="secondary" size="sm" onClick={handleExport} className="ml-auto text-xs sm:text-sm">
          <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">CSV 내보내기</span>
          <span className="sm:hidden">내보내기</span>
        </Button>
      </PMNavigationHeader>
        {/* Summary */}
        <Card className="p-4 sm:p-5 lg:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-1 sm:mb-2">작업 이력 조회</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                PM이 수행한 모든 작업 내역을 확인할 수 있습니다.
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs sm:text-sm text-muted-foreground">총 작업 수</p>
              <p className="text-2xl sm:text-3xl font-bold">{totalElements.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        {/* Filters */}
        <Card className="p-4 sm:p-5 lg:p-6 mb-4 sm:mb-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold">필터 및 검색</h3>
              {hasActiveFilters && (
                <Button variant="tertiary" size="sm" onClick={handleClearFilters} className="text-xs sm:text-sm">
                  <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">필터 초기화</span>
                  <span className="sm:hidden">초기화</span>
                </Button>
              )}
            </div>

            {/* First Row: Action Type, Entity Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">작업 타입</label>
                <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="CREATE">CREATE (생성)</SelectItem>
                    <SelectItem value="UPDATE">UPDATE (수정)</SelectItem>
                    <SelectItem value="DELETE">DELETE (삭제)</SelectItem>
                    <SelectItem value="ASSIGN">ASSIGN (할당)</SelectItem>
                    <SelectItem value="EXPORT">EXPORT (내보내기)</SelectItem>
                    <SelectItem value="IMPORT">IMPORT (가져오기)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">엔티티 타입</label>
                <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {entityTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Second Row: Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">시작 날짜</label>
                <Input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">종료 날짜</label>
                <Input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Quick Date Buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const now = new Date();
                  const yesterday = new Date(now);
                  yesterday.setDate(yesterday.getDate() - 1);
                  setStartDate(formatDateForInput(yesterday));
                  setEndDate(formatDateForInput(now));
                }}
              >
                최근 24시간
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const now = new Date();
                  const weekAgo = new Date(now);
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  setStartDate(formatDateForInput(weekAgo));
                  setEndDate(formatDateForInput(now));
                }}
              >
                최근 7일
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const now = new Date();
                  const monthAgo = new Date(now);
                  monthAgo.setMonth(monthAgo.getMonth() - 1);
                  setStartDate(formatDateForInput(monthAgo));
                  setEndDate(formatDateForInput(now));
                }}
              >
                최근 30일
              </Button>
            </div>
          </div>
        </Card>

        {/* Logs List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">로딩 중...</span>
          </div>
        ) : logs.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {hasActiveFilters ? '검색 조건에 맞는 작업 이력이 없습니다.' : '작업 이력이 없습니다.'}
            </p>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {logs.map((log) => (
                <Card key={log.id} className="p-4 hover:shadow-figma-01 transition-shadow">
                  <div className="flex items-start gap-4">
                    {/* Action Type Badge */}
                    <div className="flex-shrink-0 pt-1">
                      {getActionTypeBadge(log.actionType)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1">
                            {log.description}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{log.performedByName}</span>
                              {log.performedByEmail && (
                                <span className="text-xs">({log.performedByEmail})</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(log.actionTime)}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="tertiary"
                          size="sm"
                          onClick={() => handleViewDetail(log)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          상세
                        </Button>
                      </div>

                      {/* Entity Info */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">
                          {log.entityType}
                        </Badge>
                        {log.entityId && (
                          <span>ID: {log.entityId}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  페이지 {currentPage + 1} / {totalPages} (총 {totalElements.toLocaleString()}개)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    이전
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages - 1}
                  >
                    다음
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log 상세 정보</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 mt-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">작업 타입</label>
                  <div className="mt-1">{getActionTypeBadge(selectedLog.actionType)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">작업 시간</label>
                  <div className="mt-1">{formatDate(selectedLog.actionTime)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">수행자</label>
                  <div className="mt-1">
                    {selectedLog.performedByName}
                    {selectedLog.performedByEmail && (
                      <span className="text-sm text-muted-foreground ml-2">({selectedLog.performedByEmail})</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">엔티티</label>
                  <div className="mt-1">
                    <Badge variant="secondary">{selectedLog.entityType}</Badge>
                    {selectedLog.entityId && (
                      <span className="ml-2 text-sm text-muted-foreground">ID: {selectedLog.entityId}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">설명</label>
                <div className="mt-1 p-3 bg-muted rounded-md">{selectedLog.description}</div>
              </div>

              {/* Old Value */}
              {selectedLog.oldValue && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">변경 전 값</label>
                  <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-x-auto">
                    {(() => {
                      try {
                        const parsed = JSON.parse(selectedLog.oldValue);
                        return JSON.stringify(parsed, null, 2);
                      } catch (e) {
                        return selectedLog.oldValue;
                      }
                    })()}
                  </pre>
                </div>
              )}

              {/* New Value */}
              {selectedLog.newValue && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">변경 후 값</label>
                  <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-x-auto">
                    {(() => {
                      try {
                        const parsed = JSON.parse(selectedLog.newValue);
                        return JSON.stringify(parsed, null, 2);
                      } catch (e) {
                        return selectedLog.newValue;
                      }
                    })()}
                  </pre>
                </div>
              )}

              {/* Metadata */}
              {selectedLog.metadata && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">메타데이터</label>
                  <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-x-auto">
                    {(() => {
                      try {
                        const parsed = JSON.parse(selectedLog.metadata);
                        return JSON.stringify(parsed, null, 2);
                      } catch (e) {
                        return selectedLog.metadata;
                      }
                    })()}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
