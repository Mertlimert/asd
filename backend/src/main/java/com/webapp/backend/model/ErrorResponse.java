package com.webapp.backend.model;

import java.util.Map;

import lombok.Data;

@Data
public class ErrorResponse {
    private String message;
    private Map<String, String> errors;
    private String errorCode;
    
    public ErrorResponse(String message) {
        this.message = message;
    }
    
    public ErrorResponse(String message, Map<String, String> errors) {
        this.message = message;
        this.errors = errors;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Map<String, String> getErrors() {
        return errors;
    }

    public void setErrors(Map<String, String> errors) {
        this.errors = errors;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
    
    public void setErrorCode(String errorCode) {
        this.errorCode = errorCode;
    }
}