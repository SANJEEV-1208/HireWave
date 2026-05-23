package com.example.demo.dto;

public class DailyApplicationCount {
    private String date;
    private long count;

    public DailyApplicationCount(String date, long count) {
        this.date = date;
        this.count = count;
    }

    public String getDate() { return date; }
    public long getCount() { return count; }
}
