package com.unppal.fortune;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** 문서를 명시적으로 켜지 않은 기본 설정에서 문서가 생성되지 않는지 확인한다. */
@SpringBootTest(properties = {
        "DEV_PASSWORD=test-only-password", "API_DOCS_ENABLED=false",
        "POSTGRES_PASSWORD=test-only-password", "REDIS_PASSWORD=test-only-password"
})
@AutoConfigureMockMvc
@ActiveProfiles("api-smoke")
class OpenApiDisabledTest {
    @Autowired MockMvc mvc;

    /** 문서 비활성화가 공개 system API를 끄지 않으며 문서 엔드포인트만 제거한다. */
    @Test
    void documentsAreUnavailableWhenDisabled() throws Exception {
        mvc.perform(get("/api/system")).andExpect(status().isOk());
        mvc.perform(get("/v3/api-docs")).andExpect(status().isNotFound());
        // Swagger webjar가 classpath에 있어도 초기 설정 경로는 제공되지 않아야 한다.
        mvc.perform(get("/v3/api-docs/swagger-config")).andExpect(status().isNotFound());
    }
}
