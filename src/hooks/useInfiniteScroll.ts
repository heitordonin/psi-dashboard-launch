import { useState, useEffect, useCallback } from 'react';

interface UseInfiniteScrollProps<T> {
  initialData: T[];
  fetchMore: (page: number) => Promise<T[]>;
  pageSize?: number;
  hasMore?: boolean;
}

export const useInfiniteScroll = <T>({ 
  initialData, 
  fetchMore, 
  pageSize = 20,
  hasMore = true 
}: UseInfiniteScrollProps<T>) => {
  const [data, setData] = useState<T[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(hasMore);
  const [currentPage, setCurrentPage] = useState(1);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMoreData) return;
    
    setIsLoading(true);
    try {
      const newData = await fetchMore(currentPage + 1);
      
      if (newData.length < pageSize) {
        setHasMoreData(false);
      }
      
      setData(prevData => [...prevData, ...newData]);
      setCurrentPage(prev => prev + 1);
    } catch (error) {
      console.error('Error loading more data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMoreData, currentPage, fetchMore, pageSize]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop 
        >= document.documentElement.offsetHeight - 1000
      ) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

  const reset = useCallback((newData: T[]) => {
    setData(newData);
    setCurrentPage(1);
    setHasMoreData(true);
  }, []);

  return {
    data,
    isLoading,
    hasMoreData,
    loadMore,
    reset
  };
};