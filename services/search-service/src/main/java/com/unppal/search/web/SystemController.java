package com.unppal.search.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SystemController {
    @GetMapping("/api/system")
    public SystemInfo system() {
        return new SystemInfo("search-service", "bootstrap");
    }

    public record SystemInfo(String service, String stage) {}
}
