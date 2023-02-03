package com.appsmith.server.dtos;

import com.appsmith.external.views.Views;
import com.appsmith.server.domains.ApplicationMode;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Data;

import jakarta.validation.constraints.NotNull;

@Data
public class CommentThreadFilterDTO {
    @NotNull
    @JsonView(Views.Public.class)
    private String applicationId;

    @JsonView(Views.Public.class)
    private Boolean resolved;
    
    @JsonView(Views.Public.class)
    private ApplicationMode mode;
}
