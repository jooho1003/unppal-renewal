package com.unppal.search.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.headers.Header;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** 공개 프로세스 정보만 제공하며 외부 저장소 readiness는 보장하지 않는다. */
@RestController
public class SystemController {
    /** 인증·입력·상태 변경 없이 서비스 이름과 개발 단계를 반환한다. */
    @Operation(operationId = "getSystemInfo", summary = "서비스 프로세스 정보",
            description = "인증 없이 서비스 이름과 개발 단계를 조회한다. DB·Kafka 연결 상태는 포함하지 않는다.")
    @GetMapping("/api/system")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "공개 프로세스 정보",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = SystemInfo.class))),
            @ApiResponse(responseCode = "401", description = "잘못된 Basic 인증 정보. 오류 본문 없음",
                    headers = @Header(name = "WWW-Authenticate", description = "Basic 인증 challenge",
                            schema = @Schema(type = "string")), content = @Content)
    })
    public SystemInfo system() {
        return new SystemInfo("search-service", "bootstrap");
    }

    /**
     * 공개 프로세스 응답으로 개인정보와 비밀을 포함하지 않는다.
     * @param service 실행 중인 서비스의 이름
     * @param stage 현재 개발 단계
     */
    public record SystemInfo(
            @Schema(description = "서비스 이름", example = "search-service",
                    requiredMode = Schema.RequiredMode.REQUIRED) String service,
            @Schema(description = "개발 단계", example = "bootstrap",
                    requiredMode = Schema.RequiredMode.REQUIRED) String stage) {}
}
