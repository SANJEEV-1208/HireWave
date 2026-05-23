package com.example.demo.exceptions;

public class DuplicateResourceException extends RuntimeException{
    public DuplicateResourceException(String ResourceName, String value){
        super(String.format("%s already exists with the value %s", ResourceName, value));
    }

    public DuplicateResourceException(String message){
        super(message);
    }
}
