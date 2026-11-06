package com.unppal.search;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** 외부 저장소 없이 문서 계약과 기존 보안 경계를 대조한다. */
@SpringBootTest(properties = {
        "DEV_PASSWORD=test-only-password", "springdoc.api-docs.enabled=true",
        "springdoc.swagger-ui.enabled=true", "POSTGRES_PASSWORD=test-only-password",
        "REDIS_PASSWORD=test-only-password", "MONGODB_URI=mongodb://localhost:27017/smoke"
})
@AutoConfigureMockMvc
@ActiveProfiles("api-smoke")
class OpenApiContractTest {
    @Autowired MockMvc mvc;

    /** 공개 문서에서 operationId와 필수 응답 필드를 검증한다. */
    @Test
    void publicOpenApiDescribesSystemContract() throws Exception {
        mvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paths['/api/system'].get.operationId").value("getSystemInfo"))
                .andExpect(jsonPath("$.paths['/api/system'].get.responses['401'].headers['WWW-Authenticate'].schema.type").value("string"))
                .andExpect(jsonPath("$.paths['/api/system'].get.responses['401'].content").doesNotExist())
                .andExpect(jsonPath("$.components.schemas.SystemInfo.required",
                        org.hamcrest.Matchers.containsInAnyOrder("service", "stage")))
                .andExpect(jsonPath("$.components.schemas.SystemInfo.properties.service.type").value("string"))
                .andExpect(jsonPath("$.components.schemas.SystemInfo.properties.stage.type").value("string"));
    }

    /** Swagger 정적 화면을 인증 없이 읽을 수 있는지 확인한다. */
    @Test
    void swaggerUiIsPublic() throws Exception {
        mvc.perform(get("/swagger-ui/index.html")).andExpect(status().isOk());
    }

    /** 공개 system 응답이 해당 서비스의 기존 wire 계약을 유지한다. */
    @Test
    void systemResponseIsUnchanged() throws Exception {
        mvc.perform(get("/api/system")).andExpect(status().isOk())
                .andExpect(jsonPath("$.service").value("search-service"))
                .andExpect(jsonPath("$.stage").value("bootstrap"));
    }

    /** 문서 공개가 나머지 API의 인증 요구를 해제하지 않는다. */
    @Test
    void unknownApiStillRequiresAuthentication() throws Exception {
        mvc.perform(get("/api/not-implemented")).andExpect(status().isUnauthorized())
                .andExpect(header().string("WWW-Authenticate", org.hamcrest.Matchers.startsWith("Basic")));
    }
}
