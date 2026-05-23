package com.example.demo.exceptions;

public class ResourceNotFoundException extends RuntimeException{
    public ResourceNotFoundException(String ResourceName, Long id){
        super(String.format("%s with the id %d not found", ResourceName, id));
    }

    public ResourceNotFoundException(String ResourceName, String email){
        super(String.format("%s with the email %s not found", ResourceName, email));
    }

    public ResourceNotFoundException(String message){
        super(message);
    }

}
