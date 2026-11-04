package com.unppal.fortune.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SystemController {
    @GetMapping("/api/system")
    public SystemInfo system() {
        return new SystemInfo("fortune-service", "bootstrap");
    }

    public record SystemInfo(String service, String stage) {}
}
