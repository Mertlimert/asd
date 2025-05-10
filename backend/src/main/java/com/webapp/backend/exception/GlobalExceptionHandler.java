package com.webapp.backend.exception;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import com.webapp.backend.model.ErrorResponse;

/**
 * Tüm uygulamada fırlatılan istisnaları merkezi bir şekilde yönetir.
 * @ControllerAdvice, Spring MVC controller metotları tarafından fırlatılan
 * istisnaları yakalamak için kullanılır.
 */
@ControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {
    
    /**
     * 404 Not Found - Kaynak bulunamadı hataları
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(
            ResourceNotFoundException ex, WebRequest request) {
        
        ErrorResponse errorDetails = new ErrorResponse(ex.getMessage());
        errorDetails.setErrorCode(ErrorCodes.RESOURCE_NOT_FOUND);
        
        return new ResponseEntity<>(errorDetails, HttpStatus.NOT_FOUND);
    }
    
    /**
     * 400 Bad Request - Geçersiz istek hataları
     */
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequestException(
            BadRequestException ex, WebRequest request) {
        
        ErrorResponse errorDetails = new ErrorResponse(ex.getMessage());
        return new ResponseEntity<>(errorDetails, HttpStatus.BAD_REQUEST);
    }
    
    /**
     * 409 Conflict - Duplicate kaynak (örn. aynı email ile birden fazla kullanıcı) hataları
     */
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateResourceException(
            DuplicateResourceException ex, WebRequest request) {
        
        ErrorResponse errorDetails = new ErrorResponse(ex.getMessage());
        errorDetails.setErrorCode(ErrorCodes.DUPLICATE_RESOURCE);
        
        return new ResponseEntity<>(errorDetails, HttpStatus.CONFLICT);
    }
    
    /**
     * 401 Unauthorized - Yetkilendirme hataları
     */
    @ExceptionHandler(AuthException.class)
    public ResponseEntity<ErrorResponse> handleAuthException(
            AuthException ex, WebRequest request) {
        
        ErrorResponse errorDetails = new ErrorResponse(ex.getMessage());
        errorDetails.setErrorCode(ErrorCodes.UNAUTHORIZED);
        
        return new ResponseEntity<>(errorDetails, HttpStatus.UNAUTHORIZED);
    }
    
    /**
     * 400 Bad Request - Sipariş işlemleri ile ilgili özel hatalar
     */
    @ExceptionHandler(OrderException.class)
    public ResponseEntity<ErrorResponse> handleOrderException(
            OrderException ex, WebRequest request) {
        
        ErrorResponse errorDetails = new ErrorResponse(ex.getMessage());
        errorDetails.setErrorCode(ex.getErrorCode());
        
        return new ResponseEntity<>(errorDetails, HttpStatus.BAD_REQUEST);
    }
    
    /**
     * 400 Bad Request - Adres işlemleri ile ilgili özel hatalar
     */
    @ExceptionHandler(AddressException.class)
    public ResponseEntity<ErrorResponse> handleAddressException(
            AddressException ex, WebRequest request) {
        
        ErrorResponse errorDetails = new ErrorResponse(ex.getMessage());
        errorDetails.setErrorCode(ex.getErrorCode());
        
        return new ResponseEntity<>(errorDetails, HttpStatus.BAD_REQUEST);
    }
    
    /**
     * 400 Bad Request - İade işlemleri ile ilgili özel hatalar
     */
    @ExceptionHandler(ReturnException.class)
    public ResponseEntity<ErrorResponse> handleReturnException(
            ReturnException ex, WebRequest request) {
        
        ErrorResponse errorDetails = new ErrorResponse(ex.getMessage());
        errorDetails.setErrorCode(ex.getErrorCode());
        
        return new ResponseEntity<>(errorDetails, HttpStatus.BAD_REQUEST);
    }
    
    /**
     * 400 Bad Request - Kupon işlemleri ile ilgili özel hatalar
     */
    @ExceptionHandler(CouponException.class)
    public ResponseEntity<ErrorResponse> handleCouponException(
            CouponException ex, WebRequest request) {
        
        ErrorResponse errorDetails = new ErrorResponse(ex.getMessage());
        errorDetails.setErrorCode(ex.getErrorCode());
        
        return new ResponseEntity<>(errorDetails, HttpStatus.BAD_REQUEST);
    }
    
    /**
     * 400 Bad Request - Validasyon hataları (örn. @Valid anotasyonu ile kontrol edilen giriş verileri)
     * Bu metot, MethodArgumentNotValidException istisnaları için özel hata mesajları döndürür.
     */
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers, 
            HttpStatusCode status, WebRequest request) {
        
        Map<String, String> errors = new HashMap<>();
        
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        ErrorResponse errorResponse = new ErrorResponse("Validation failed", errors);
        errorResponse.setErrorCode(ErrorCodes.VALIDATION_ERROR);
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
    
    /**
     * 500 Internal Server Error - Diğer tüm istisnalar
     * Bu genel istisna handler'ı, özellikle ele alınmamış diğer tüm istisnaları yakalar.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(
            Exception ex, WebRequest request) {
        
        ErrorResponse errorDetails = new ErrorResponse(
            "Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyiniz."
        );
        
        return new ResponseEntity<>(errorDetails, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}