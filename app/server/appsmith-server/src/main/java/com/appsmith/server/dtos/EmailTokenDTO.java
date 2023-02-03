package com.appsmith.server.dtos;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class EmailTokenDTO {
    @JsonView(Views.Public.class)
    private String email;

    @JsonView(Views.Public.class)
    private String token;
}
