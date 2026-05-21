import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * 操作日志拦截器 - 标记需要记录日志的接口
 * 具体日志写入由各模块 controller 中调用 OperationLogService 完成
 * 此拦截器仅用于统一记录请求时间等信息
 */
@Injectable()
export class OperationLogInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        // 生产环境可在此汇总请求耗时等指标
        if (process.env.NODE_ENV !== 'production') {
          console.log(
            `[${request.method}] ${request.url} - ${duration}ms`,
          );
        }
      }),
    );
  }
}
