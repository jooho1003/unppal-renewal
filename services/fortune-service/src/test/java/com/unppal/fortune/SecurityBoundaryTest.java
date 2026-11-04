package com.unppal.fortune;

import com.unppal.fortune.config.SecurityConfig;
import com.unppal.fortune.web.SystemController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {SystemController.class, SecurityBoundaryTest.ProtectedEndpoint.class},
        properties = "DEV_PASSWORD=test-only-password")
@Import({SecurityConfig.class, SecurityBoundaryTest.ProtectedEndpoint.class})
class SecurityBoundaryTest {
    @Autowired MockMvc mvc;

    @Test
    void systemEndpointIsPublic() throws Exception {
        mvc.perform(get("/api/system"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.service").value("fortune-service"))
                .andExpect(jsonPath("$.stage").value("bootstrap"));
    }

    @Test
    void privateEndpointRequiresAuthentication() throws Exception {
        mvc.perform(get("/api/protected"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void correctPasswordAllowsPrivateEndpoint() throws Exception {
        mvc.perform(get("/api/protected").with(httpBasic("learner", "test-only-password")))
                .andExpect(status().isOk());
    }

    @Test
    void wrongPasswordIsRejected() throws Exception {
        mvc.perform(get("/api/protected").with(httpBasic("learner", "wrong-password")))
                .andExpect(status().isUnauthorized());
    }

    @RestController
    static class ProtectedEndpoint {
        @GetMapping("/api/protected")
        String protectedEndpoint() { return "authenticated"; }
    }
}
