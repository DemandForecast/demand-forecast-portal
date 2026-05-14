import {
    HttpInterceptor,
    HttpRequest,
    HttpHandler,
    HttpEvent,
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AuthService } from "@auth0/auth0-angular";
import { Observable, switchMap } from "rxjs";

@Injectable()
export class CustomAuthHttpInterceptor implements HttpInterceptor {
    constructor(private authService: AuthService) {}
    intercept(
        req: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        return this.authService.getAccessTokenSilently().pipe(
            switchMap((accessToken: string) => {
                // console.log("dfdfg",accessToken);
                const authReq = req.clone({
                    setHeaders: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                return next.handle(authReq);
            })
        );
    }
}
