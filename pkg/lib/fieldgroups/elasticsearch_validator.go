package fieldgroups

import (
	"fmt"
	"net/http"
	"strconv"
)

// Validate checks the configuration settings for this field group
func (fg *ElasticSearchFieldGroup) Validate() []ValidationError {

	// Make empty errors
	errors := []ValidationError{}

	// If not set, skip
	if fg.LogsModel != "elasticsearch" {
		return errors
	}

	// If log model config is missing
	if fg.LogsModelConfig == nil {
		newError := ValidationError{
			Tags:    []string{"LOGS_MODEL_CONFIG"},
			Policy:  "A is Required",
			Message: "LOGS_MODEL_CONFIG is required for Elasticsearch",
		}
		errors = append(errors, newError)
		return errors
	}

	// Check for elastic search config
	if fg.LogsModelConfig.ElasticsearchConfig == nil {
		newError := ValidationError{
			Tags:    []string{"LOGS_MODEL_CONFIG.ELASTIC_SEARCH_CONFIG"},
			Policy:  "A is Required",
			Message: "LOGS_MODEL_CONFIG.ELASTIC_SEARCH_CONFIG is required for Elasticsearch",
		}
		errors = append(errors, newError)
		return errors
	}

	// Check that host is available
	if fg.LogsModelConfig.ElasticsearchConfig.Host == "" {
		newError := ValidationError{
			Tags:    []string{"LOGS_MODEL_CONFIG.ELASTIC_SEARCH_CONFIG.HOST"},
			Policy:  "A is Required",
			Message: "LOGS_MODEL_CONFIG.ELASTIC_SEARCH_CONFIG.HOST is required for Elasticsearch",
		}
		errors = append(errors, newError)
	}

	// Check for port
	if fg.LogsModelConfig.ElasticsearchConfig.Port == 0 {
		newError := ValidationError{
			Tags:    []string{"LOGS_MODEL_CONFIG.ELASTIC_SEARCH_CONFIG.PORT"},
			Policy:  "A is Required",
			Message: "LOGS_MODEL_CONFIG.ELASTIC_SEARCH_CONFIG.PORT is required for Elasticsearch",
		}
		errors = append(errors, newError)
	}

	// Check for access key
	if fg.LogsModelConfig.ElasticsearchConfig.AccessKey == "" {
		newError := ValidationError{
			Tags:    []string{"LOGS_MODEL_CONFIG.ELASTIC_SEARCH_CONFIG.ACCESS_KEY"},
			Policy:  "A is Required",
			Message: "LOGS_MODEL_CONFIG.ELASTIC_SEARCH_CONFIG.ACCESS_KEY is required for Elasticsearch",
		}
		errors = append(errors, newError)
	}

	if fg.LogsModelConfig.ElasticsearchConfig.SecretKey == "" {
		newError := ValidationError{
			Tags:    []string{"LOGS_MODEL_CONFIG.ELASTIC_SEARCH_CONFIG.SECRET_KEY"},
			Policy:  "A is Required",
			Message: "LOGS_MODEL_CONFIG.ELASTIC_SEARCH_CONFIG.SECRET_KEY is required for Elasticsearch",
		}
		errors = append(errors, newError)
	}

	// Get parameters to build url
	host := fg.LogsModelConfig.ElasticsearchConfig.Host
	port := strconv.Itoa(fg.LogsModelConfig.ElasticsearchConfig.Port)
	//indexPrefix := fg.LogsModelConfig.ElasticsearchConfig.IndexPrefix

	// Build url
	url := "https://" + host + ":" + port + "/" + fg.LogsModelConfig.ElasticsearchConfig.IndexPrefix + "*"
	success := ValidateElasticSearchCredentials(url, fg.LogsModelConfig.ElasticsearchConfig.AccessKey, fg.LogsModelConfig.ElasticsearchConfig.SecretKey)
	if !success {
		newError := ValidationError{
			Tags:    []string{"LOGS_MODEL_CONFIG.ELASTIC_SEARCH_CONFIG.SECRET_KEY", "LOGS_MODEL_CONFIG.ELASTIC_SEARCH_CONFIG.SECRET_KEY"},
			Policy:  "Auth",
			Message: "Could not validate Elasticsearch credentials",
		}
		errors = append(errors, newError)
	}

	return errors

}

// ValidateElasticSearchCredentials will validate credentials
func ValidateElasticSearchCredentials(url, accessKey, accessSecret string) bool {

	// Generated by curl-to-Go: https://mholt.github.io/curl-to-go
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		fmt.Println("o", err.Error())
	}
	req.SetBasicAuth(accessKey, accessSecret)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Println("e", err.Error())
	}

	if resp.StatusCode != 200 {
		return false
	}

	return true
}
